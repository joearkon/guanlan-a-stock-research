import {createHash, randomUUID} from 'node:crypto';
import {fail, normalizeEngine} from './core.mjs';
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const uuid = value => typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value);
const today = () => new Date().toLocaleDateString('sv-SE', {timeZone: 'Asia/Shanghai'});
const validDay = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value && value <= today();
const text = (value, max) => typeof value === 'string' && value.trim().length <= max ? value.trim() : '';

export class LocalLibrary {
 constructor(store, service) {
  this.store = store; this.service = service; this.db = store.db;
  this.db.exec(`CREATE TABLE IF NOT EXISTS library_runs(id TEXT PRIMARY KEY,account TEXT NOT NULL,subject_key TEXT NOT NULL,identity TEXT NOT NULL,input TEXT NOT NULL,job_id TEXT,created_at INTEGER NOT NULL);
   CREATE INDEX IF NOT EXISTS library_account_time ON library_runs(account,created_at DESC);
   CREATE INDEX IF NOT EXISTS library_subject_time ON library_runs(account,subject_key,created_at DESC);
   CREATE TABLE IF NOT EXISTS records(id TEXT NOT NULL,account TEXT NOT NULL,stock_code TEXT NOT NULL,updated_at TEXT NOT NULL,value TEXT NOT NULL,PRIMARY KEY(id,updated_at));
   CREATE INDEX IF NOT EXISTS records_account_code ON records(account,stock_code,updated_at DESC);`);
 }
 normalized(input) {
  const subject = {kind: input.subject?.kind, name: text(input.subject?.name, 80), code: input.subject?.code || null};
  if (!uuid(input.requestId) || !['company','industry','topic'].includes(subject.kind) || !subject.name || (subject.kind === 'company' && !/^\d{6}$/.test(subject.code || '')) || !validDay(input.asof)) throw fail('invalid_request', '研究对象、编号或资料日期无效；不接受未来日期。');
  const note = input.note == null ? null : text(input.note, 8000);
  if (input.note != null && !note) throw fail('invalid_request', '笔记正文为空或过长。');
  return {requestId: input.requestId, subject, asof: input.asof, note, focus: text(input.focus || '',1000), industry: text(input.industry || '',80), snapshotId: text(input.snapshotId || '',160) || null, deepThinking: input.deepThinking === true};
 }
 create(account, input, {engine, evidence = [], providerConfig} = {}) {
  const normalized = this.normalized(input), identity = digest(normalized);
  const old = this.db.prepare('SELECT account,identity FROM library_runs WHERE id=?').get(normalized.requestId);
  if (old) {
   if (old.account !== account || old.identity !== identity) throw fail('request_conflict', '同一请求编号参数不一致，未覆盖旧报告或重复调用。');
   return this.get(account, normalized.requestId);
  }
  if (!normalized.note) normalizeEngine(engine);
  const subjectKey = digest(normalized.subject), created = Date.now();
  this.db.exec('BEGIN IMMEDIATE');
  try {
   this.db.prepare('INSERT INTO library_runs VALUES(?,?,?,?,?,?,?)').run(normalized.requestId, account, subjectKey, identity, JSON.stringify(normalized), normalized.note ? null : normalized.requestId, created);
   if (!normalized.note) this.service.create(account, {turnId: normalized.requestId, engine, evidence, providerConfig, question: `研究${normalized.subject.name}${normalized.subject.code ? ' '+normalized.subject.code : ''}，区分事实、业务受益逻辑、相反证据与缺口。研究重点见上下文。`, context: {page:'我的研究', asof:normalized.asof, subject:normalized.subject, focus:normalized.focus, industry:normalized.industry, snapshotId:normalized.snapshotId}, deepThinking:normalized.deepThinking});
   this.db.exec('COMMIT');
  } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  return this.get(account, normalized.requestId);
 }
 view(row) {
  if (!row) return null;
  const input = JSON.parse(row.input), job = row.job_id ? this.service.get(row.account, row.job_id) : null, result = job?.result;
  return {id:row.id, key:row.subject_key, kind:input.subject.kind, name:input.subject.name, code:input.subject.code, industry:input.industry, focus:input.focus, template:input.note?'note':input.subject.kind==='company'?'company-four':input.subject.kind, asof:input.asof, snapshotId:input.snapshotId, deepThinking:input.deepThinking, createdAt:new Date(row.created_at).toISOString(), updated_at:new Date(row.created_at).toISOString(), status:input.note?'complete':job?.status||'needs_attention', note:input.note, answer:result?.answer, report:result?{...result,localHarness:true}:null, error:job?.error||(!input.note&&!job?'原任务记录缺失；未自动重跑。':null), localHarness:true};
 }
 get(account, id) { return this.view(this.db.prepare('SELECT * FROM library_runs WHERE account=? AND id=?').get(account,id)); }
 history(account, key, before = '') {
  const cursor = Number(before) || Number.MAX_SAFE_INTEGER;
  const rows = this.db.prepare('SELECT rowid,* FROM library_runs WHERE account=? AND subject_key=? AND rowid<? ORDER BY rowid DESC LIMIT 21').all(account,key,cursor), visible = rows.slice(0,20);
  return {runs:visible.map(row=>this.view(row)), nextCursor:rows.length>20?String(visible.at(-1).rowid):null, storage:'local'};
 }
 list(account, {search='',kind='',offset=0} = {}) {
  const term=String(search).trim().slice(0,160),start=Math.max(0,Math.min(100000,Math.floor(Number(offset)||0)));
  const where=`r.account=? AND r.rowid=(SELECT MAX(x.rowid) FROM library_runs x WHERE x.account=r.account AND x.subject_key=r.subject_key) AND (?='' OR json_extract(r.input,'$.subject.kind')=?) AND (?='' OR instr(lower(COALESCE(json_extract(r.input,'$.subject.name'),'')||' '||COALESCE(json_extract(r.input,'$.subject.code'),'')||' '||COALESCE(json_extract(r.input,'$.industry'),'')||' '||COALESCE(json_extract(r.input,'$.focus'),'')),lower(?))>0)`;
  const params=[account,kind,kind,term,term],total=this.db.prepare(`SELECT COUNT(*) AS n FROM library_runs r WHERE ${where}`).get(...params).n;
  const rows=this.db.prepare(`SELECT r.*, (SELECT COUNT(*) FROM library_runs x WHERE x.account=r.account AND x.subject_key=r.subject_key) AS versions FROM library_runs r WHERE ${where} ORDER BY r.created_at DESC,r.rowid DESC LIMIT 20 OFFSET ?`).all(...params,start);
  const archives=rows.map(row=>{const r=this.view(row);return {...r,versions:row.versions,summary:(r.answer||r.note||'').slice(0,180),summaryAsOf:r.answer?r.asof:null};});
  return {archives,total,nextOffset:start+20<total?start+20:null,storage:'local'};
 }
 saveRecord(account, input, updating = false) {
  const title=text(input.title,120), content=text(input.content,8000), refs=input.evidenceRefs??[];
  if (!/^\d{6}$/.test(input.stockCode||'')||!title||!content||(input.dataDate!=null&&!validDay(input.dataDate))||(!updating&&!validDay(input.dataDate))||!Array.isArray(refs)||refs.length>10||refs.some(r=>typeof r.title!=='string'||!validDay(r.dataDate)||!/^https?:\/\//.test(r.url||''))) throw fail('invalid_request','手工记录或引用格式无效。');
  this.db.exec('BEGIN IMMEDIATE');
  try {
   const old=updating?this.db.prepare('SELECT value FROM records WHERE account=? AND id=? ORDER BY updated_at DESC LIMIT 1').get(account,input.id):null;
   if(updating&&(!old||JSON.parse(old.value).updatedAt!==input.updatedAt))throw fail('version_conflict','手工记录已有新版本，旧文本保留，请重新读取核对。');
   const previous=old?JSON.parse(old.value):null;
   if(previous&&previous.stockCode!==input.stockCode)throw fail('invalid_request','修订不能更改证券身份。');
   const updatedAt=new Date(Math.max(Date.now(),previous?Date.parse(previous.updatedAt)+1:0)).toISOString();
   const value={id:previous?.id||randomUUID(),stockCode:input.stockCode,title,content,dataDate:input.dataDate||null,evidenceRefs:refs,updatedAt,createdAt:previous?.createdAt||updatedAt,origin:'manual',storage:'local'};
   this.db.prepare('INSERT INTO records VALUES(?,?,?,?,?)').run(value.id,account,value.stockCode,updatedAt,JSON.stringify(value));this.db.exec('COMMIT');return value;
  }catch(error){this.db.exec('ROLLBACK');throw error;}
 }
 records(account, {id,code,before=''} = {}) {
  if(id){const rows=this.db.prepare('SELECT value FROM records WHERE account=? AND id=? ORDER BY updated_at DESC').all(account,id).map(r=>JSON.parse(r.value)), record=rows[0]||null, older=rows.slice(1).filter(r=>!before||r.updatedAt<before), revisions=older.slice(0,20);return {record,revisions,nextCursor:older.length>20?revisions.at(-1).updatedAt:null,storage:'local'};}
  const rows=this.db.prepare(`SELECT r.value FROM records r WHERE r.account=? AND (?='' OR r.stock_code=?) AND r.updated_at=(SELECT MAX(x.updated_at) FROM records x WHERE x.account=r.account AND x.id=r.id) ORDER BY r.updated_at DESC LIMIT 100`).all(account,code||'',code||'');
  return {records:rows.map(r=>JSON.parse(r.value)),storage:'local'};
 }
}
