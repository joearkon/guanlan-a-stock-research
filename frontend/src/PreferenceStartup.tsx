import {useEffect,useRef} from 'react';
import {useLocation,useNavigate} from 'react-router-dom';
import {usePreferences} from './personal-preferences';
export default function PreferenceStartup({ready}:{ready:boolean}){
 const location=useLocation(),navigate=useNavigate(),initial=useRef(location),done=useRef(false),{preferences}=usePreferences();
 useEffect(()=>{if(done.current||!ready)return;done.current=true;const start=initial.current;if(start.key===location.key&&start.pathname==='/'&&!start.search&&!start.hash&&preferences.defaultPage!=='/')navigate(preferences.defaultPage,{replace:true});},[ready,location,navigate,preferences.defaultPage]);return null;
}
