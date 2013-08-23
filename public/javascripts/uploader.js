function Uploader(args){

    var bug = new debug("http://ec2-184-73-148-154.compute-1.amazonaws.com") // todo remove

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

    var vID;
    var isUploading = true;
    var percent = 0;
    var CHUNK_SIZE = 0
    var chunkPercent = 0

    var request                 // use this to abort ajax request
    var aborted = false         //

    if (file.slice){
        postVideo(true)
    } else {
        postVideo(false)
    }

    this.pause = function(){
        isUploading = false;
        if (request) request.abort()
    }

    this.resume = function(){
        isUploading = true;
        if (vID) getChunks(vID)
        else alert("No video in progress")
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

    function postVideo(hasSlice){
        request = $.ajax({
            url: uploadURL + "/video",
            type: "POST",
            data: {
                title: title,
                description: description,
                tags: tags,
                filesize: file.size,
                slice: hasSlice
            },
            success: function(json){
                if (json.video && json.video._id){
                    vID = json.video._id;
                    CHUNK_SIZE = json.chunksize
                    chunkPercent = 100 * Math.min(CHUNK_SIZE, file.size) / file.size
                    bug.send({
                        CHUNK_SIZE: CHUNK_SIZE,
                        chunkPercent: chunkPercent
                    })
                    getChunks(vID)
                } else failure({
                    msg: "posting video",
                    er: JSON.stringify(json, 0, 2)
                })
            },
        })
    }

    function delayGetChunks(vID){
        setTimeout(function(){
            getChunks(vID)
        }, 5000)
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
                    else delayGetChunks(vID)
                },
                timeout: 10000,
                error: function(xhr, status, er){
                    delayGetChunks(vID)
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
                        bug.send(percent) // todo remove
                        progress({
                            percent: percent
                        })
                        done(null)
                    }
                })
            }, function(er){
                // retry if any chunk fails. Successful chunks in the
                // batch won't be returned, so duplicates aren't an issue
                if (er){
                    console.log(JSON.stringify(er, 0, 2))
                    delayGetChunks(vID)
                } else {
                    getChunks(vID)
                }
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
        if (!chunk.size){
            var start = chunk.position * CHUNK_SIZE;
            var end = start + Math.min(CHUNK_SIZE, file.size - start);
            var newfile = file.slice(start, end)
        } else {
            var newfile = file
        }

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
                done({message: "s3 upload error", xhr: xhr, status: status, er: er})
            },
            xhr: function(){
                var xhr = $.ajaxSettings.xhr();
                if(xhr.upload){
                    bug.send({
                        msg: "xhr.upload"
                    })
                    xhr.upload.addEventListener('progress', function(event) {
                        if (event.lengthComputable) {
                            var percentComplete = 100 * event.loaded / file.size + percent;
                            bug.send({
                                percentComplete: percentComplete
                            })
                            progress({percent: percentComplete})
                        } else {
                            bug.send({
                                msg: "no event.lengthComputable"
                            })
                        }
                    }, false);
                } else {
                    bug.send({
                        msg: "no xhr.upload"
                    })
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
