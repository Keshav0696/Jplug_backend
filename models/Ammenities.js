const mongoose = require('mongoose');


const ammenitiesSchema = new mongoose.Schema({
delivery : {
       type: Boolean,
    default : false,
    default : false
},
accept_credit : {
       type: Boolean,
    default : false
},
onSiteAtm : {
       type: Boolean,
    default : false
},
security  : {
       type: Boolean,
    default : false
},
wheelchairAccessible : {
       type: Boolean,
    default : false
},
onsiteSmoking : {
       type: Boolean,
    default : false
},
veteran_patient_discount : {
    type: Boolean,
    default : false
},
terminal_patient_discount : {
    type: Boolean,
    default : false
},
age_requirement : {
    type: Number,
    default : false  
},
user_id : {
    type: mongoose.Schema.Types.ObjectId,
    ref : 'User' 
}
});


module.exports = mongoose.model('Ammenities', ammenitiesSchema);