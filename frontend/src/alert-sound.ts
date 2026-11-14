let audio:AudioContext|undefined;
export async function unlockAlertSound(){
 try{const Factory=window.AudioContext||(window as any).webkitAudioContext;if(!Factory)return false;audio??=new Factory();await audio!.resume();return audio!.state==='running';}catch{return false;}
}
export async function playAlertSound(volume=.35){
 // Never create or resume audio automatically on a server receipt.
 if(!audio||audio.state!=='running')return false;
 try{const at=audio.currentTime,gain=audio.createGain();gain.connect(audio.destination);gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,Math.min(1,Math.max(0,volume))*.06),at+.015);gain.gain.exponentialRampToValueAtTime(.0001,at+.22);const oscillator=audio.createOscillator();oscillator.type='sine';oscillator.frequency.setValueAtTime(880,at);oscillator.frequency.setValueAtTime(660,at+.11);oscillator.connect(gain);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};oscillator.start(at);oscillator.stop(at+.24);return true;}catch{return false;}
}
export function lockAlertSound(){const previous=audio;audio=undefined;void previous?.close().catch(()=>{});}
