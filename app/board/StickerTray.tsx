"use client";// this runs in the broswer - it has buttons and clicks 

import { useState, useTransition } from "react";
import { STICKERS } from "@/lib/stickers";
import { unlockSticker } from  "./sticker-actions";

//We pass in the users current photos so we know they can afford 
export function StickerTray({points}: { points: number }) {
    const [open, setOpen] = useState(false); //is the tray showing?
    const [isPending, startTransition] = useTransition(); // shows "working..." during the server call 

    //When a sticker is clicked, ask the server to unlock it 
    function handleUnlock(stickerKey: string){
        startTransition(async() => {
            try{
                await unlockSticker(stickerKey); //sevrer check spoints and charges
            }catch (err){
                //The server throws if you can't afford it or arent logged in
                alert (err instanceof Error ? err.message: "Could not unlock sticker");
            }
        });
    }
    return (
    <div style={{ marginBottom: "1rem" }}>
      {/* The toggle button — styled to match your points pill */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "rgba(0,0,0,0.6)",   // same dark pill as your points
          color: "white",
          border: "none",
          padding: "0.4rem 0.9rem",
          borderRadius: 999,               // fully rounded pill
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        {open ? "✕ Close" : "✨ Stickers"}
      </button>

      {/* The tray panel — only shows when open */}
      {open && (
        <div
          style={{
            marginTop: "0.6rem",
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)", // 5 stickers per row
            gap: "0.6rem",
            padding: "0.9rem",
            background: "rgba(255,255,255,0.92)",  // soft white, slightly see-through
            borderRadius: 16,                      // rounded corners
            boxShadow: "0 8px 24px rgba(0,0,0,0.25)", // floating shadow
            backdropFilter: "blur(4px)",           // frosted-glass effect over the board
            maxWidth: 420,
          }}
        >
          {STICKERS.map((sticker) => {
            const canAfford = points >= sticker.cost;
            return (
              <button
                key={sticker.key}
                disabled={!canAfford || isPending}
                onClick={() => handleUnlock(sticker.key)}
                title={canAfford ? `Unlock for ${sticker.cost} pts` : "Not enough points"}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.3rem",
                  padding: "0.5rem",
                  border: "none",
                  borderRadius: 12,
                  background: canAfford ? "#f3f4f6" : "transparent",
                  opacity: canAfford ? 1 : 0.4,     // fade locked ones
                  cursor: canAfford ? "pointer" : "not-allowed",
                  transition: "transform 0.1s, background 0.1s",
                }}
                // tiny hover pop on affordable stickers
                onMouseEnter={(e) => {
                  if (canAfford) e.currentTarget.style.transform = "scale(1.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <img
                  src={`/stickers/${sticker.key}.png`}
                  alt={sticker.label}
                  style={{ width: 44, height: 44, objectFit: "contain" }}
                />
                <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#374151" }}>
                  {canAfford ? `${sticker.cost} pts` : "🔒"}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}