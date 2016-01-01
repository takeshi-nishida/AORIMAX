var socket;

$(function(){
    socket = io();
    
    socket.on('connect', function(data){
        socket.emit('login', { roomId: roomId });
    });
    
    socket.on('vote', function(data){
        var t = $("#" + data.target);
        processVote(t, data.count);
    });
    
    socket.on('aori', function(data){
        processAori($("#" + data.target));
        processAori($("#" + data.target + "-panel"));
    });
    
    $('#star-row td').click(function(e){
        sendAori($(e.target).data("name"));
    });
    
    $('.sendVote').click(function(e){
        sendVote($(e.target).parents("td").data("name"));
    });
    
    $(".voteButton").click(function(e){
        sendVote($(e.target).parents(".button-panel").data("name"));
    });
    
    $(".aoriButton").click(function(e){
        sendAori($(e.target).parents(".button-panel").data("name"));
    });
    
    $("#star-row td").each(function(){
        var t = $(this);
        resetStar(t, t.data("count"));
    });
});

function sendVote(name){
    if(name) socket.emit('vote', { target: name });
}

function sendAori(name){
    if(name) socket.emit('aori', { target: name });
}

function processVote(t, count){
    var heights = $.makeArray(t.find('div').map(function(){ return $(this).height() }));
    var sum = heights.length > 0 ? heights.reduce(function(p,c){ return p + c; }) : 0;

    if(sum < t.height() * 0.95){
        playStar(t, 1);
    }
    else{
        resetStar(t, count);
    }
}

function resetStar(t, count){
    t.empty();
    var delay = 0;

    for(var size = 1000; size >= 1; size /= 10){
        for(var i = 0; i < Math.floor(count / size); i++){
            playStar(t, size, delay);
            delay += 50;
        }
        count %= size;
    }
}

function playStar(t, size, delay){
    var o = $('<div class="star">' + size + '</div>').css('bottom', t.height() + "px").addClass("star" + size);
    t.prepend(o);
    o.velocity({ bottom: '0px' }, { delay: delay });
}

function processAori(t){
    t.velocity({ backgroundColor: '#FFD357' }, { duration: 'fast', loop: 5 });
}