const KEY="collectionMasterSaveV1";
export const freshSave=()=>({wallet:0,lifetimeEarned:0,started:false,unopenedPacks:0,tokens:[],equippedToken:null});
export function loadSave(){try{return {...freshSave(),...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{return freshSave()}}
export function saveGame(s){localStorage.setItem(KEY,JSON.stringify(s))}
export function restartGame(){localStorage.removeItem(KEY)}