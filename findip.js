const redis = require("redis");
const fetch = require('node-fetch');
const rd = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
});
const client = redis.createClient(6379);
client.on("error", (err) => {
    console.log("cSomething went wrong", err);
    throw err;
});

const render = ({ info, ip }) => {
    let ipinfo = JSON.parse(info);
    console.log("\n", "\n")
    console.log(`IP address: ${ip}`, "\n")
    console.log("Continent name:", ipinfo.continent_name, "\n")
    console.log("Country name:", ipinfo.country_name, "\n")
    console.log("State/Region name:", ipinfo.region_name, "\n")
    console.log("Latitude:", ipinfo.latitude, "\n")
    console.log("Longitude:", ipinfo.longitude, "\n")
}
const getarg = (flag) => {
    let i = process.argv.indexOf(flag);
    return i === -1 ? null : process.argv[i + 1];
}
const findip = (ip) => {
    client.get(ip, (err, ipinfo) => {
        if (ipinfo) {
            render({ ip: ip, info: ipinfo });
        } else {
            let ipstack = "http://api.ipstack.com/" + ip.trim() + "?access_key=ae4854a7fe49882068f3232d261fbb6a&fields=continent_name,country_name,region_name,latitude,longitude";

            fetch(ipstack)
                .then(res => res.json())
                .then((ipinfo) => {
                    // Save the  response in Redis db
                    client.set(ip, JSON.stringify(ipinfo));
                    //resturn api response to client
                    render({ ip: ip, info: ipinfo });
                }).catch((er) => {
                    console.log("error:", er);
                })
        }
    })
}

let iparg = getarg("-ip");
if (iparg) {
    findip(iparg)
} else {
    rd.question(`Enter any IP address`, (ip) => {
        console.log(ip);
        findip(ip);
        rd.close();
    })
}