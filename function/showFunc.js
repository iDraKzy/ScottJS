const fetch = require("node-fetch")
const mongoUtil = require("../mongoUtil.js")

async function updateDB(method, name, collection) {
    return fetch(`https://www.episodate.com/api/show-details?q=${name}`)
    .then(res => res.json())
    .then(async json => {
        const show = json.tvShow
        if (show.length === 0) {
            console.log("ERROR")
            console.log(show.length)
            throw new ReferenceError("This show doesn't exist.")
        } else {
            const query = {
                name: show.permalink,
                displayName: show.name,
                apiURL: show.url,
                synopsis: show.description,
                synopsis_source: show.description_source,
                start_date: show.start_date,
                end_date: show.end_date,
                country: show.country,
                satus: show.status,
                network: show.network,
                image: show.image_path,
                thumbnail: show.image_thumbnail_path,
                rating: show.rating,
                countdown: show.countdown,
                genres: show.genres
            }
            switch(method) {
                case "ADD":
                    await collection.insertOne(query)
                        .then(res => console.log(`Show inserted successfuly with id ${res.insertedId}`))
                        .catch(e => console.error("An error occured when trying to add a show to the DB. Error: " + e))
                    return query
                case "UPDATE":
                    await collection.deleteOne({name: name})
                        .then(res => console.log(`Show deleted`))
                        .catch(e => console.error("An error occured when trying to delete a show in the DB. Error: " + e))
                    await collection.insertOne(query)
                        .then(res => console.log(`Show inserted successfuly with id ${res.insertedId}`))
                        .catch(e => console.error("An error occured when trying to add a show to the DB. Error: " + e))
                    return query
            }
        }
    })

} 

module.exports.getShow = async function(name) {
    name = name.replace(" ", "-").toLowerCase()
    const showCollection = mongoUtil.getDb().collection("tvshow")
    const showDoc = await showCollection.findOne({name: name})
    //Check if the show is in the DB
    if (showDoc === null) {
        try {
            //If it's not try to add it to the DB
            const showQuery = await updateDB("ADD", name, showCollection)
            return showQuery
        }
        catch(e) {
            console.log("ERROR getSow:" + e)
            //If show doesn't exist return undefined
            if (e instanceof ReferenceError) {
                return undefined
            }
        }
    } else {
        let airDate = showDoc.countdown.air_date
        airDate = airDate.replace(" ", "T")
        airDate = airDate + "+00:00"
        airDate = new Date(airDate)
        if (airDate < Date.now()) {
            updateDB("UPDATE", name, showCollection)
        } else {
            return showDoc
        }
    }
}