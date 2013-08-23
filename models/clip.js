var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

/**
 * Clip Schema
 */

var ClipSchema = new Schema({
  user: {type : Schema.ObjectId, ref : 'User'},
  created_by: {type : Schema.ObjectId, ref : 'User'},
  created_at: {type : Date, default : Date.now},
  approved: {type: Boolean, default : false},
  videogami_vid: {},
  gif: {}
});

ClipSchema.statics = {
  findClips: function (options, cb) {
    var qr = {};
    if(options.date_lt){
      qr =  {created_at: {$lt: new Date(options.date_lt)}};
    }
    var query = this.find(qr) 
      .where('user').equals(options.user._id)
      .sort({'created_at': -1})
      .populate('user', 'name username')
      .populate('created_by', 'name username');
    if(options.limit) {
      query.limit(options.limit);
    }
    query.exec(cb);
  },
  findAllUnapproved: function (options, cb) {
    var query = {};
    if(options.date_lt){
      query =  {created_at: {$lt: new Date(options.date_lt)}};
    }
    this.find(query) 
    .where('approved').ne(true)
    .sort({'created_at': -1})
    .limit(options.limit)
    .populate('user', 'name username')
    .populate('created_by', 'name username')
    .exec(cb);
  },
  findById: function(id, cb) {
    this.findOne({'_id': id})
      .populate('user', 'name username')
      .populate('created_by', 'name username')
      .exec(cb);
  }
};
mongoose.model('Clip', ClipSchema);
