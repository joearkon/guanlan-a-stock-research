import {useSearchParams} from 'react-router-dom';import CollectiveRelay from './CollectiveRelay';import ConceptRelay from './ConceptRelay';
export default function Relay(){const [params]=useSearchParams();return params.get('legacy')==='1'?<ConceptRelay/>:<CollectiveRelay/>;}
