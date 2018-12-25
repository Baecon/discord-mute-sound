const Discord = require('discord.js');
const client = new Discord.Client();
const inquirer = require('inquirer');
const VAD = require('node-vad')
const mic = require('mic');
const fs = require('fs');
const clear = require('clear');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
var user
var played = 0
setInterval(()=>{played = 0}, 30000)
var muted = false
var input = mic({
    rate: '16000',
    channels: '1',
    debug: false,
    exitOnSilence: 6
});

const vadStream = VAD.createStream({
    mode: VAD.Event.AGGRESSIVE,
    audioFrequency: 16000,
    debounceTime: 1000
});

if (fs.existsSync('./user.json')) {
    var user = require('./user.json')
    clear()
    startDiscord(user.token)
}

else {
    firstTimeSetup().then(user =>{
        clear()
        startDiscord(user.token)
    }).catch(err =>{console.log(err)})
}

async function firstTimeSetup() {
    var prompts = [{
        name: 'start',
        message: `Seems like this is your first time using discord-mute-sound!\nI'll run you thru setup \n[Press enter to continue]`
    },
    {
        name: 'token',
        message: 'Whats you discord token? (needed to check when you\'re muted)\nRefer here to find your token: https://touched-me.today/QgsmCM\nRight click to paste\n\ntoken: '
    },
    {
        name: 'soundSelection',
        type: 'list',
        message: `Which sound will you like to use(go to ./files and listen to the sounds)\n`,
        choices: ['tsMute', 'earrapeMute']
    }]
    await inquirer.prompt(prompts).then(answers =>{
        fs.writeFileSync('./user.json', JSON.stringify(answers) , 'utf-8');
    })
    
    var user = require("./user.json")
    return user
}

function startDiscord(token){
    input.start();
    var micInputStream = input.getAudioStream();
    micInputStream.pipe(vadStream).on("data", data =>{
        //console.log(data)
        if(muted == true && data.speech.start == true && played == 0) {
            exec(`.\\files\\cmdmp3 .\\files\\${user.soundSelection}.mp3`)
        }
        else played = 0
    })
    client.on("ready", () => {
        voiceChannel = client.user.voiceChannel
        console.log(`connected as ${client.user.tag}`)
        })
        client.on('message', message =>{
            if (!message.author.id == client.user.id) return
            if (message.content == '!>ping') message.edit('yup im ready')
            if (message.content == '!>state') message.edit(`muted?: ${muted}`)
        }).catch(console.log('message was not able to be edited (msg might have been deleted)'))
        client.on('voiceStateUpdate', (oldMember, newMember) =>{
        if(newMember.id == client.user.id) {
            if(newMember.selfMute) muted = true
            else muted = false
        }
    })
    client.login(token).catch(err =>{
        if(err.toString().includes('Incorrect login details were provided') || err.toString().includes('An invalid token was provided')) {
            console.log('Incorrect login details!\nrelaunch to rerun setup')
            setTimeout(function(){
                exec('del .\\user.json')
            }, 5000)
        }
        else console.log(err)
    })
}
