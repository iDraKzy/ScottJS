const mongoUtil = require("../mongoUtil.js")
const mongodb = require("mongodb")

module.exports.checkMoney = async function(id, amount) {
    const collection = mongoUtil.getDb().collection("members")
    const userDoc = await collection.findOne({discord_id: id})
    let limit = (!userDoc.limit) ? 10000 : userDoc.limit
    let knowsAbout = !userDoc.limit
    let won = (!userDoc.won) ? 0 : userDoc.won
    let bank = (!userDoc.bank) ? 0 : userDoc.bank
    let limitReachedOn = (!userDoc.bank) ? 0 : userDoc.limitReachedOn
    if (!userDoc.limit) {
        collection.updateOne({discord_id: id}, {$set: {
            limit: mongodb.Int32(limit),
            won: mongodb.Int32(won),
            bank: mongodb.Int32(bank)
        }})
    }
    return [userDoc.money > amount, userDoc.money, limit, won, bank, !knowsAbout, limitReachedOn]
}

module.exports.addMoney = async function(id, moneyToAdd) {
    console.log("AddMoney Called")
    const db = mongoUtil.getDb()
    const collection = db.collection("members")
    let userDoc = await collection.findOne({discord_id: id})
    let oldMoney = userDoc.money
    let newMoney = oldMoney + moneyToAdd
    collection.updateOne({discord_id: id}, {$set: {money: mongodb.Int32(newMoney)}})
}