// Initial setup
const Discord = require("discord.js");
const dc = new Discord.Client();
const secrets = require("./secrets.json");

// Vars
let channel_id = "823914840720408626"; 
let channel = undefined;
let timeout = 10*1000;
let messages_to_delete = [];
// Setup
dc.once("ready", async ()=>{
    console.log("ready");
    //channel = await dc.channels.cache.get(channel_id);
    channel = await dc.channels.fetch(channel_id, true, true);
    console.log("Listening in: " + channel.name);
});

function registerMessage(msg){
    console.log(`Registering id ${msg.id}`)
    let obj = [msg.id, msg.createdTimestamp]
    messages_to_delete.push(obj);
}
// Return true if deleted message
function checkFirstMessage(){
    if (messages_to_delete.length == 0){
        return false;
    }
    let cur = messages_to_delete.shift();
    let now = Date.now();
    if (cur[1] + timeout < now){
        console.log(`Deleting message id ${cur[0]}`)
        // Chain of fetch -> delete -> log
        channel.messages.fetch(cur[0])
          .then((msg)=>{
            console.log(msg.content);
            return msg.delete({
                timeout: 0,
                reason: "Automatic wipe"
            });
          })
          .then((msg)=>{
              console.log("successfully deleted message");
              console.log(msg.content);
          })
          .catch((reason)=>{
              console.log(`Error: ${reason}`)
          })
        return true;
    } else {
        messages_to_delete.unshift(cur);
        return false;
    }
}
// Check regularly
setInterval(() => {
    let i = 0;
    while(checkFirstMessage()) // Side effects whee
        i++;
    if (i > 0)
        console.log(`deleted ${i} Messages`);
}, 5000);

function wipeChannel(){
    channel.messages.fetch({limit: 100})
    .then((msgs)=>{
        for (const msg of msgs.array()){
            msg.delete({
                timeout: 0,
                reason: "Channel wipe"
            }).catch(console.error);
        }
    })
}

// Now do the handler
dc.on("message", (msg)=>{
    if (msg.content.startsWith("!wipe")){
        // Wipe and remove all pending messages
        wipeChannel();
        messages_to_delete = [];
        return;
    }
    if (msg.channel.id != channel_id) // Early channel filter
        return;
    registerMessage(msg);
});


// Login
dc.login(secrets["discord-api-token"]);