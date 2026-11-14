import {useMutation,useQueryClient} from '@tanstack/react-query';
export const notificationBase='/api/notifications';
export async function writeNotification(path:string,method:string,body:any){
 const response=await fetch(notificationBase+path,{method,credentials:'same-origin',headers:{'content-type':'application/json','x-gl':'1'},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
 const value=await response.json();if(!response.ok)throw Error(value.error||'保存未确认，请重新读取后重试');return value;
}
export function useAlertWrite(){const client=useQueryClient();return useMutation({retry:false,mutationFn:({path,method,body}:{path:string,method:string,body:any})=>writeNotification(path,method,body),onSuccess:(data,variables)=>{if(data.rule)client.setQueryData<any>(['resource',notificationBase+'/rules'],old=>old?{...old,rules:[data.rule,...old.rules.filter((r:any)=>r.id!==data.rule.id)]}:old);if(data.deleted)client.setQueryData<any>(['resource',notificationBase+'/rules'],old=>old?{...old,rules:old.rules.filter((r:any)=>r.id!==variables.path.split('/').at(-1))}:old);void client.invalidateQueries({predicate:q=>typeof q.queryKey[1]==='string'&&q.queryKey[1].startsWith(notificationBase)});}});}
