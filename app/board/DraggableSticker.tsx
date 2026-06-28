"use client";

import { useState } from "react";
import { moveSticker } from "./sticker-actions";

type Sticker = {id: string; stickerKey: string; x: number; y: number};

export function DraggableSticker({ sticker }: {sticker: Sticker}){
    //Local position so dragging feels instant (we save to the DB when the drag ends)
    const [pos, setPos] = useState({x: sticker.x, y:sticker.y});
    const [dragging, setDragging]= useState(false);

    //When the mouse moves while dragging, update the on-screen position
    function onMouseMove(e: React.MouseEvent){
        if (!dragging) return;
        setPos({x: e.clientX - 24, y: e.clientY - 24}); //-24 centers a 48 px sticker on the cursor 
    }

    //When the user lets go, stop dragging and SAVE the final spot to the database
    function onMouseUp(){
        if (!dragging) return;
        setDragging(false);
        moveSticker(sticker.id, pos.x, pos.y); //server actioin from Step 4
    }

    return(
        <img
            src={`/stickers/${sticker.stickerKey}.png`}
            alt="sticker"
            onMouseDown={() => setDragging(true)}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp} // also save if the cursor leaves the sticker mid-drag
            style={{
                position: "absolute", // float freely over the board
                left: pos.x,
                top: pos.y,
                width: 48,
                height: 48,
                cursor: dragging ? "grabbing" : "grab",
                userSelect: "none",   // don't accidentally "select" the image while dragging
            }}
            draggable={false}        // turn off the browser's built-in image drag (it fights ours)
        />
    ); 
}