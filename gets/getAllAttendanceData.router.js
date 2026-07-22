const express=require('express')


module.exports=(db)=>{
    const router=express.Router()
    const collectionOfAllAttendance=db.collection("attendance")

    // get all attendance------------
    router.get("/",async(req,res)=>{
        try{
            const page=parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 100;
            const search= req.query.search || "";
            const status = req.query.status || "";
            const date = req.query.date || "";

            const skip=(page - 1)*limit
            const query={}
             
            // search workerId or name-----------
            if(search){
                query.$or=[
                    {
                        workerId:{
                            $regex:search,
                            $options:"i"
                        },
                    },
                    {
                        name:{
                            $regex:search,
                            $options:"i"
                        },
                    },
                ];
            }

            // filter by status--------
            if(status && status !=="all"){
                query.status=status
            }

            // filter by date---------
            if(date){
                query.date=date
            }

           const total=await collectionOfAllAttendance.countDocuments(query)
           
           const result= await collectionOfAllAttendance
              .find(query)
              .sort({date:-1,_id:-1})
              .skip(skip)
              .limit(limit)
              .toArray()

           res.send({
            success:true,
            total,
            totalPages:Math.ceil(total / limit),
            currentPage:page,
            limit,
            data:result
           })
        }catch(err){
           res.status(500).json({
            success:false,
            message:"Failed to fetch allAttendance data",
            err:err.message
        })
        }
    })
    return router

}