// const mongoose=require('mongoose')
// const config={
//     MONGO_URI:"mongodb://0.0.0.0:27017/E-commerce"
// }
// const Connect=async()=>{
//     try {
//         const conn=await mongoose.connect(config.MONGO_URI,{
//             useNewUrlParser:true,
//             useUnifiedTopology:true,
          
//         })    
//         console.log('Mongodb connected');
//     } catch (error) {
//         console.log(error);
//         process.exit(1)
//     }
// }
// module.exports=Connect
const mongoClint = require('mongodb').MongoClient

const state={
    db:null
}
module.exports.connect = function (done) {
    const url = "mongodb://0.0.0.0:27017/"
    const dbname = 'E-commerce'

    mongoClint.connect(url,(err,data)=>{
        
        if(err) return done(err)
        state.db = data.db(dbname)
        done()
    })
}

module.exports.get = function(){
    return state.db
}