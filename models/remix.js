var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

/**
 * Remix Schema
 */

var RemixSchema = new Schema({
    title: String,
    user: {type : Schema.ObjectId, ref :'User'},
    clips: [{type: Schema.ObjectId, ref: 'Clip'}],
    created_at: {type : Date, default : Date.now},
    videogami_rid: {},
    gifs: [],
});

RemixSchema.statics = {
    findRemixes: function(options, cb) {
        if(!options.limit) {
            options.limit = 1000;
        }
        if(!options.user){
            this.find({})
                .sort({'created_at': -1})
                .limit(options.limit)
                .populate('user', 'name username')
                .populate('clips', 'videogami_vid gif')
                .exec(cb);
        } else {
            this.find({})
                .where('user').equals(options.user._id)
                .sort({'created_at': -1})
                .limit(options.limit)
                .populate('user', 'name username')
                .populate('clips', 'videogami_vid gif')
                .exec(cb);
        }
    },
    findByUid: function() {

    }
};
mongoose.model('Remix', RemixSchema);