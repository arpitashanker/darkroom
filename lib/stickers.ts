//The master lsit of every sticker, its image and its point cost 
//This lives on the SERVER and the client - but only the server is TRUSTEd 
//we re-check the cost on the server before charging points 

export type StickerDef ={
    key: string;  //matches the PNG filename 
    label: string; //friendly name shown in the tray 
    cost: number; //how many points to unlock it 
};

export const STICKERS: StickerDef[] = [
    {key: "sticker1",      label: "Beachy",                  cost: 10},
    {key: "sticker2",      label: "Hibiscus",                cost: 10},
    {key: "sticker3",      label: "Camera",                  cost: 10},
    {key: "sticker4",      label: "Strawberry Button",       cost: 10},
    {key: "sticker5",      label: "Flower Button",           cost: 10},


    {key: "sticker6",      label: "Star",                    cost: 20},
    {key: "sticker7",      label: "Conch",                   cost: 20},
    {key: "sticker8",      label: "Kiwi",                    cost: 20},
    {key: "sticker9",      label: "Teddy Bear",              cost: 20},
    {key: "sticker10",     label: "Snoopy 1",                cost: 20},
    
    
    {key: "sticker11",      label: "Snoopy 2",               cost: 30},
    {key: "sticker12",      label: "Curious George 1",       cost: 30},
    {key: "sticker13",      label: "Curious George 2",       cost: 30},
    {key: "sticker14",      label: "Curious George 3",       cost: 30},
    {key: "sticker15",      label: "Curious George 4",       cost: 30},
]
//can look up a sticker by the key and will rteurn error if not found 
//we use this on the server to get the REal cost (never trust the Browsers number"
export function getSticker(key: string): StickerDef | undefined{
    return STICKERS.find((s) => s.key === key);
}