const text = `
Ani_The_Ripper has played for a total of [42 Hours 5 Minutes 39 Seconds] - (29 Hours 29 Minutes 50 Seconds Active | 12 Hours 35 Minutes 48 Seconds AFK) - <29.00%>
OvertimeC has played for a total of [22 Hours 2 Minutes 12 Seconds] - (19 Hours 9 Minutes 26 Seconds Active | 2 Hours 52 Minutes 45 Seconds AFK) - <13.00%>
Fruce_ has played for a total of [11 Hours 35 Minutes 31 Seconds] - (9 Hours 56 Minutes 12 Seconds Active | 1 Hours 39 Minutes 18 Seconds AFK) - <14.00%>
Sparklyeyes has played for a total of [4 Hours 23 Minutes 32 Seconds] - (2 Hours 44 Minutes 40 Seconds Active | 1 Hours 38 Minutes 52 Seconds AFK) - <37.00%>
TheSK_001 has played for a total of [47 Minutes 36 Seconds] - (31 Minutes 7 Seconds Active | 16 Minutes 28 Seconds AFK) - <34.00%>
Applepie_xD has played for a total of [43 Minutes 56 Seconds] - (43 Minutes 56 Seconds Active | 0 Seconds AFK) - <.00%>
ani_the_ripper has played for a total of [0 Seconds] - (0 Seconds Active | 0 Seconds AFK) - <.00%>
sparklyeyes has played for a total of [0 Seconds] - (0 Seconds Active | 0 Seconds AFK) - <.00%>
overtimecx has played for a total of [0 Seconds] - (0 Seconds Active | 0 Seconds AFK) - <.00%>
Fruce_ has played for a total of [0 Seconds] - (0 Seconds Active | 0 Seconds AFK) - <.00%>
Applepie_xD has played for a total of [0 Seconds] - (0 Seconds Active | 0 Seconds AFK) - <.00%>
`;

const extractPlaytime = (text) => {
    const regex = /(\w+)\s+has\s+played\s+for\s+a\s+total\s+of\s+\[(.*?)\]\s+-\s+\(/g;
    const playtimes = {};
    
    let match;
    while ((match = regex.exec(text)) !== null) {
        const playerName = match[1];
        const playtime = match[2];
        
        // Ignore "0 Seconds" entries
        if (!playtime.includes("0 Seconds")) {
            playtimes[playerName] = playtime;
        }
    }
    
    return playtimes;
};

const playtimes = extractPlaytime(text);
console.log(playtimes);