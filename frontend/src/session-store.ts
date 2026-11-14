/** Browser privacy settings may deny storage. State in React remains usable. */
export const sessionStore={
 getItem(key:string):string|null{try{return sessionStorage.getItem(key);}catch{return null;}},
 setItem(key:string,value:string):boolean{try{sessionStorage.setItem(key,value);return true;}catch{return false;}},
 removeItem(key:string):void{try{sessionStorage.removeItem(key);}catch{/* No persistent state to remove when access is denied. */}}
};
