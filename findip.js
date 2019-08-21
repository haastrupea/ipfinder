const redis = require("redis");
const fetch = require('node-fetch');

const client = redis.createClient(6379);
client.on("error", (err) => {
    console.log("Something went wrong", err);
    throw err;
});
const ask=(msg="Enter any IP address")=>{
    process.stdout.write(msg);
    process.stdout.write(" > ");
}

const render = ({ info, ip,loop }) => {
    let ipinfo = JSON.parse(info);
    console.log("\n", "\n")
    console.log(`IP address: ${ip}`, "\n")
    console.log("Continent name:", ipinfo.continent_name, "\n")
    console.log("Country name:", ipinfo.country_name, "\n")
    console.log("State/Region name:", ipinfo.region_name, "\n")
    console.log("Latitude:", ipinfo.latitude, "\n")
    console.log("Longitude:", ipinfo.longitude, "\n")
    if(loop){
        ask()
    }else{
        process.exit();
    }
}
const getarg = (flag) => {
    let i = process.argv.indexOf(flag);
    return i === -1 ? null : process.argv[i + 1];
}
//todo:ensure that the ip can not 
const isValid= (ip)=>/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip);

const findip = (ip,loop=false) => {
    if(ip.toLowerCase()!=="exit" && !isValid(ip)){
    ask("Please Enter a Valid IP Address");
    }else{
        client.get(ip, (err, ipinfo) => {
            if(err){
                console.log("DB Error:",err.message)
                return;
            }
            if (ipinfo) {
                render({ ip: ip, info: ipinfo,loop:loop });
            } else {
                let ipstack = "http://api.ipstack.com/" + ip.trim() + "?access_key=ae4854a7fe49882068f3232d261fbb6a&fields=continent_name,country_name,region_name,latitude,longitude";
    
                fetch(ipstack)
                    .then(res => res.json())
                    .then((ipinfo) => {
                        // Save the  response in Redis db
                        client.set(ip, JSON.stringify(ipinfo));
                        //resturn api response to client
                        render({ ip: ip, info: JSON.stringify(ipinfo),loop:loop});
                    }).catch((er) => {
                        console.log("error fetching the IP details:", er);
                    })
            }
        })
    }
}

let iparg = getarg("-ip");
if (iparg) {
    findip(iparg)
} else {
    ask();
    process.stdin.on("data",(ip) => {
        findip(ip.toString().trim(),true);
        if(ip.toString().trim().toLowerCase() ==="exit"){
            process.exit();
        }
    })
}
