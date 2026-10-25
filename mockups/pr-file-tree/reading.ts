export type FileReading={active:number;top:number;horizontal:Readonly<Record<number,number>>;mode:'unified'|'split'};
export type FileReadings=Readonly<Record<string,FileReading>>;
export const rememberFile=(readings:FileReadings,path:string,value:FileReading):FileReadings=>({...readings,[path]:{...value,horizontal:{...value.horizontal}}});
