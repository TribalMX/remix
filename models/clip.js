var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

/**
 * Clip Schema
 */

var ClipSchema = new Schema({
    user: {type : Schema.ObjectId, ref : 'User'},
    created_by: {type : Schema.ObjectId, ref : 'User'},
    created_at: {type : Date, default : Date.now},
    // approved: Boolean,
    videogami_vid: {},
    gif: {}
});

ClipSchema.statics = {
    findClips: function (options, cb) {
        var query = {};
        if(!options.limit) {
            options.limit = 10;
        }
        if(options.date_lt){
            query =  {created_at: {$lt: new Date(options.date_lt)}};
        }
        this.find(query) 
        .where('user').equals(options.user._id)
        .sort({'created_at': -1})
        .limit(options.limit)
        .populate('user', 'name username')
        .populate('created_by', 'name username')
        .exec(cb);
    }
};
mongoose.model('Clip', ClipSchema);
