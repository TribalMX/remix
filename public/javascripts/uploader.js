function Uploader(args){
     var uploadURL = args.uploadURL;
    // var username = args.username;
    // var token = args.token;
    var file = args.file;
    var title = args.title;
    var description = args.description;
    var tags = args.tags;
    var progress = args.progress;
    var success = args.success;
    var failure = args.failure;

    var CHUNK_SIZE = 5 * 1048576
    // var CHUNK_SIZE = 102400
    // var CHUNK_SIZE = 16384

    var vID;
    var isUploading = true;
    var percent = 0;
    var chunkPercent = 100 * CHUNK_SIZE / file.size;

    var request                 // use this to abort ajax request
    var aborted = false         //

    postVideo();

    this.pause = function(){
        isUploading = false;
        if (request) request.abort()
    }

    this.resume = function(){
        isUploading = true;
        if (vID) getChunks(vID)
        else postVideo()
    }

    this.cancel = function(){
        aborted = true
        if (request) request.abort()
        if (vID) cancelUpload(vID, function(er, video){
            console.log("cancel upload " + JSON.stringify(video, 0, 2))
            if (er) failure({msg: "cancel upload query er", er: er})
            else failure({msg: "cancel upload success", video: video})
        })
    }

    function postVideo(){
        request = $.ajax({
            url: uploadURL + "/video",
            type: "POST",
            data: {
                title: title,
                description: description,
                tags: tags,
                filesize: file.size
            },
            success: function(json){
                if (json.video && json.video._id){
                    vID = json.video._id;
                    getChunks(vID)
                } else failure({
                    msg: "posting video",
                    er: JSON.stringify(json, 0, 2)
                })
            },
        })
    }

    function getChunks(vID){
        if (isUploading && !aborted){
            request = $.ajax({
                url: uploadURL + "/upload",
                type: "get",
                data: {
                    vID: vID
                },
                success: function(json){
                    if (json.chunks && json.chunks.length) postChunks(json.chunks)
                    else if (json.video) success({
                        video: json.video
                    })
                    else getChunks(vID)
                    // else failure({
                    //     msg: "getting chunks",
                    //     er: JSON.stringify(json, 0, 2)
                    // })
                },
                timeout: 10000,
                error: function(xhr, status, er){
                    getChunks(vID)
                    // if (er == "timeout") getChunks(vID) // try again
                    // else failure({
                    //     msg: "getting chunks error",
                    //     er: JSON.stringify(xhr, 0, 2)
                    // })
                }
            })
        }
    }

    function postChunks(chunks){
        if (isUploading && !aborted){
            async.each(chunks, function(chunk, done){
                postChunk(chunk, function(er, chunk){
                    if (er) done(er)
                    else {
                        percent += chunkPercent;
                        progress({
                            percent: percent
                        })
                        done(null)
                    }
                })
            }, function(er){
                // retry if any chunk fails. Successful chunks in the
                // batch won't be returned, so duplicates aren't an issue
                if (er) console.log(JSON.stringify(er, 0, 2))
                getChunks(vID)
            })
                }
    }

    function postChunk(chunk, done){
        if (isUploading && !aborted){
            async.waterfall([
                function(done){
                    upload(chunk, function(er){
                        if (er) done(er)
                        else done(null)
                    })
                },
                function(done){
                    notifyPostSuccess(chunk, function(er, chunk){
                        if (er) done(er)
                        else done(null, chunk)
                    })
                }
            ], function(er, chunk){
                if (er) done(er)
                else done(null, chunk)
            })
        }
    }

    function upload(chunk, done){
        var newfile;
        var start = chunk.position * CHUNK_SIZE;
        var end = start + Math.min(CHUNK_SIZE, file.size - start);
        if (file.webkitSlice) newfile = file.webkitSlice(start, end)
        else newfile = file.slice(start, end)

        var key = chunk.key
        var s3key = chunk.policy.s3Key
        var policybase64 = chunk.policy.s3PolicyBase64
        var signature = chunk.policy.s3Signature

        var fd = new FormData()

        fd.append("key", key)
        fd.append("acl", "public-read")
        fd.append("Content-Type", "")
        fd.append("AWSAccessKeyId", s3key)
        fd.append("policy", policybase64)
        fd.append("signature", signature)

        fd.append("file", newfile)

        request = $.ajax({
            processData: false,
            contentType: false,
            type: "post",
            url: "http://vdload.s3.amazonaws.com/",
            data: fd,
            xhrFields: {withCredentials: true},
            dataType: "xml",
            success: function(result){ // amazon doesn't return any result
                done(null)
            },
            error: function(xhr, status, er){
                done({
                    message: "s3 upload error",
                    er: JSON.stringify(xhr, 0, 2)
                })
            },
            xhr: function(){
                var xhr = $.ajaxSettings.xhr();
                if(xhr.upload){
                    xhr.upload.addEventListener('progress', function(event) {
                        if (event.lengthComputable) {
                            var percentComplete = 100 * event.loaded / file.size + percent;
                            progress({percent: percentComplete})
                        }
                    }, false);
                }
                return xhr;
            }
        })
    }

    function notifyPostSuccess(chunk, done){
        request = $.ajax({
            url: uploadURL + "/upload",
            type: "post",
            data: {
                vID: chunk.vID,
                position: chunk.position
            },
            success: function(json){
                if (json.chunk) done(null, json.chunk)
                else done({
                    msg: "notify post success fails",
                    er: JSON.stringify(json, 0, 2)
                })
            },
            timeout: 10000,
            error: function(xhr, status, er){
                if (er == "timeout") notifyPostSuccess(chunk, done)
                else done({
                    msg: "notify post success error",
                    er: er,
                    status: status,
                    xhr: xhr
                })
            }
        })
    }

    function cancelUpload(vID, done){
        request = $.ajax({
            url: uploadURL + "/upload/" + vID + "/cancel",
            type: "delete",
            data: {
                // username: username,
                // token: token,
            },
            success: function(json){
                console.log(json);
                if (json.video) done(null, json.video)
                else done({msg: "cancel upload ajax er", json: json})
           },
        })
    }
}