const mongoUtil = require("../mongoUtil.js")

module.exports.checkMoney = async function(id, amount) {
    const collection = mongoUtil.getDb().collection("members")
    const userDoc = await collection.findOne({discord_id: id})
    return [userDoc["money"] > amount, userDoc["money"]]
}