
var cards = {};
var totalcolumns = 0;
var columns = [];
var boardInitialized = false;
var keyTrap = null;

let w = $(window).width(); //图片宽度
let h = $(window).height(); //图片高度

var need = $(".pic").get(0); //将jQuery对象转换为dom对象

var baseurl = location.pathname.substring(0, location.pathname.lastIndexOf('/'));
var socket = io.connect({ path: baseurl + "/socket.io" });

function sendAction(a, d) {
    var message = {
        action: a,
        data: d
    };
    socket.json.send(message);
}

socket.on('connect', function () {
    console.log('successful socket.io connect');

    //let the final part of the path be the room name
    var room = location.pathname.substring(location.pathname.lastIndexOf('/'));

    //imediately join the room which will trigger the initializations
    sendAction('createCard', room);
});

socket.on('disconnect', function () {
    blockUI("Server disconnected. Refresh page to try and reconnect...");
    //$('.blockOverlay').click($.unblockUI);
});


socket.on('message', function (data) {
    console.log('successful message');
    getMessage(data);
});

function unblockUI() {
    console.log('successful unlocked');
    $.unblockUI({ fadeOut: 50 });
}

function blockUI(message) {
    console.log('successful blockedui');
    message = message || 'Waiting...';

    $.blockUI({
        message: message,

        css: {
            border: 'none',
            padding: '15px',
            backgroundColor: '#000',
            '-webkit-border-radius': '10px',
            '-moz-border-radius': '10px',
            opacity: 0.5,
            color: '#fff',
            fontSize: '50px'
        },

        fadeOut: 0,
        fadeIn: 10
    });
}

//响应事件
function getMessage(m) {
    var message = m;
    var action = message.action;
    var data = message.data;


    switch (action) {

        case 'initCards':
            initCards(data);
            break;

        case 'moveCard':
            moveCard($("#" + data.id), data.position);
            break;

        case 'createCard':
            drawNewCard(data.id, data.text, data.x, data.y, data.colour, null);
            break;

        case 'deleteCard':
            $("#" + data.id).fadeOut(500,
                function () {
                    $(this).remove();
                }
            );
            break;

        case 'editCard':
            $("#" + data.id).children('.content:first').text(data.value);
            break;

        case 'initColumns':
            initColumns(data);
            break;

        case 'setBoardSize':
            resizeBoard(message.data);
            break;

        default:
            //unknown message
            alert('unknown action: ' + JSON.stringify(message));
            break;
    }


}

$(document).bind('keyup', function (event) {
    keyTrap = event.which;
});

function drawNewCard(id, text, x, y, colour, animationspeed) {
    //cards[id] = {id: id, text: text, x: x, y: y, rot: rot, colour: colour};

    // <div id="id" class="card colour draggable" style="-webkit-transform:rotate(rot deg);">
    // <img src="images/icons/token/Xion.png" class="card-icon delete-card-icon" />
    // <img class="card-image" src="images/colour -card.png">
    // <div id="content:id" class="content stickertarget droppable">text</div>
    // <span class="filler"></span>
    // </div>

    var h = '<div id="' + id + '" class="card ' + colour +
        ' draggable"\
	">\
	<img class="card-icon delete-card-icon" />\
	<img class="card-image" src="images/' +
        colour + '-card.png">\
	<div id="content:' + id +
        '" class="content droppable">' +
        text + '</div><span class="filler"></span>\
	</div>';


    //h为html中的一段代码，通过$(h)绑定到card中，

    var card = $(h);
    card.appendTo('#board');

    card.draggable({
        snap: false,
        snapTolerance: 5,
        containment: [0, 0, 2000, 2000],
        stack: ".card",
        start: function (event, ui) {
            keyTrap = null;
        },
        drag: function (event, ui) {
            if (keyTrap == 27) {
                ui.helper.css(ui.originalPosition);
                return false;
            }
        },
        handle: "div.content"
    });

    card.bind("dragstop", function (event, ui) {
        if (keyTrap == 27) {
            keyTrap = null;
            return;
        }

        var data = {
            id: this.id,
            position: ui.position,
            oldposition: ui.originalPosition,
        };

        sendAction('moveCard', data);
    });

    card.children(".droppable").droppable({
        drop: function (event, ui) {
            var cardId = $(this).parent().attr('id');

            var data = {
                cardId: cardId,
            };
            $('.card-hover-draggable').removeClass('card-hover-draggable');
        },
        hoverClass: 'card-hover-draggable'
    });

    var speed = Math.floor(Math.random() * 1000);
    if (typeof (animationspeed) != 'undefined') speed = animationspeed;

    //var colours = ['yellow', 'green', 'blue', 'white'];
    var startPosition = $("#create-yellowcard").position();
    var startPosition = $("#create-greencard").position();
    var startPosition = $("#create-bluecard").position();
    var startPosition = $("#create-whitecard").position();

    card.css('top', startPosition.top - card.height() * 0.5);
    card.css('left', startPosition.left - card.width() * 0.5);

    card.animate({
        left: x + "px",
        top: y + "px"
    }, speed);

    card.hover(
        function () {
            $(this).addClass('hover');
            $(this).children('.card-icon').fadeIn(10);
        },
        function () {
            $(this).removeClass('hover');
            $(this).children('.card-icon').fadeOut(150);
        }
    );

    card.children('.card-icon').hover(
        function () {
            $(this).addClass('card-icon-hover');
        },
        function () {
            $(this).removeClass('card-icon-hover');
        }
    );

    card.children('.delete-card-icon').click(
        function () {
            $("#" + id).remove();
            sendAction('deleteCard', {
                'id': id
            });
        }
    );

    card.children('.content').editable(function (value, settings) {
        onCardChange(id, value);
        return (value);
    }, {
            type: 'textarea',
            submit: 'OK',
            style: 'inherit',
            cssclass: 'card-edit-form',
            placeholder: '双击开始编辑',
            onblur: 'submit',
            event: 'dblclick',
        });

}


function onCardChange(id, text) {
    sendAction('editCard', {
        id: id,
        value: text
    });
}

function moveCard(card, position) {
    card.animate({
        left: position.left + "px",
        top: position.top + "px"
    }, 500);
}



function createCard(id, text, x, y, rot, colour) {
    drawNewCard(id, text, x, y, colour, null);

    var action = "createCard";

    var data = {
        id: id,
        text: text,
        x: x,
        y: y,
        rot: rot,
        colour: colour
    };

    sendAction(action, data);

}

function randomCardColour() {
    var colours = ['yellow', 'green', 'blue', 'white'];

    var i = Math.floor(Math.random() * colours.length);

    return colours[i];
}


function initCards(cardArray) {
    $('.card').remove();

    cards = cardArray;
    unblockUI();

    /*for (var i in cardArray) {
        card = cardArray[i];

        drawNewCard(
            card.id,
            card.text,
            card.x,
            card.y,
            card.colour,
            0
        );
    }*/
    drawNewCard(001, 'stgawegfadf', 100, 100, 'blue', 0);

    boardInitialized = true;
    unblockUI();
}



function drawNewColumn(columnName) {
    var cls = "col";
    if (totalcolumns === 0) {
        cls = "col first";
    }

    $('#icon-col').before('<td class="' + cls +
        '" width="10%" style="display:none"><h2 id="col-' + (totalcolumns + 1) +
        '" class="editable">' + columnName + '</h2></td>');

    $('.editable').editable(function (value, settings) {
        onColumnChange(this.id, value);
        return (value);
    }, {
            style: 'inherit',
            cssclass: 'card-edit-form',
            type: 'textarea',
            placeholder: 'New',
            onblur: 'submit',
            width: '',
            height: '',
            xindicator: '<img src="images/ajax-loader.gif">',
            event: 'dblclick', //event: 'mouseover'
        });

    $('.col:last').fadeIn(1500);

    totalcolumns++;
}

function onColumnChange(id, text) {
    var names = Array();


    $('.col').each(function () {

        var thisID = $(this).children("h2").attr('id');

        if (id == thisID) {
            names.push(text);
        } else {
            names.push($(this).text());
        }

    });

    updateColumns(names);
}

function displayRemoveColumn() {
    if (totalcolumns <= 0) return false;

    $('.col:last').fadeOut(150,
        function () {
            $(this).remove();
        }
    );

    totalcolumns--;
}

function createColumn(name) {
    if (totalcolumns >= 8) return false;

    drawNewColumn(name);
    columns.push(name);

    var action = "updateColumns";

    var data = columns;

    sendAction(action, data);
}

function deleteColumn() {
    if (totalcolumns <= 0) return false;

    displayRemoveColumn();
    columns.pop();

    var action = "updateColumns";

    var data = columns;

    sendAction(action, data);
}

function updateColumns(c) {
    columns = c;

    var action = "updateColumns";

    var data = columns;

    sendAction(action, data);
}

function deleteColumns(next) {
    //delete all existing columns:
    $('.col').fadeOut('slow', next());
}

function initColumns(columnArray) {
    totalcolumns = 0;
    columns = columnArray;

    $('.col').remove();

    for (var i in columnArray) {
        column = columnArray[i];

        drawNewColumn(
            column
        );
    }
}







function setCookie(c_name, value, exdays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + ((exdays === null) ? "" : "; expires=" +
        exdate.toUTCString());
    document.cookie = c_name + "=" + c_value;
}

function getCookie(c_name) {
    var i, x, y, ARRcookies = document.cookie.split(";");
    for (i = 0; i < ARRcookies.length; i++) {
        x = ARRcookies[i].substr(0, ARRcookies[i].indexOf("="));
        y = ARRcookies[i].substr(ARRcookies[i].indexOf("=") + 1);
        x = x.replace(/^\s+|\s+$/g, "");
        if (x == c_name) {
            return unescape(y);
        }
    }
}



function boardResizeHappened(event, ui) {
    var newsize = ui.size;

    sendAction('setBoardSize', newsize);
}

function resizeBoard(size) {
    $(".board-outline").animate({
        height: size.height,
        width: size.width
    });
}

function calcCardOffset() {
    var offsets = {};
    $(".card").each(function () {
        var card = $(this);
        $(".col").each(function (i) {
            var col = $(this);
            if (col.offset().left + col.outerWidth() > card.offset().left +
                card.outerWidth() || i === $(".col").size() - 1) {
                offsets[card.attr('id')] = {
                    col: col,
                    x: ((card.offset().left - col.offset().left) / col.outerWidth())
                };
                return false;
            }
        });
    });
    return offsets;
}


//moves cards with a resize of the Board
//doSync is false if you don't want to synchronize
//with all the other users who are in this room
function adjustCard(offsets, doSync) {
    $(".card").each(function () {
        var card = $(this);
        var offset = offsets[this.id];
        if (offset) {
            var data = {
                id: this.id,
                position: {
                    left: offset.col.position().left + (offset.x * offset.col
                        .outerWidth()),
                    top: parseInt(card.css('top').slice(0, -2))
                },
                oldposition: {
                    left: parseInt(card.css('left').slice(0, -2)),
                    top: parseInt(card.css('top').slice(0, -2))
                }
            }; //use .css() instead of .position() because css' rotate
            //console.log(data);
            if (!doSync) {
                card.css('left', data.position.left);
                card.css('top', data.position.top);
            } else {
                //note that in this case, data.oldposition isn't accurate since
                //many moves have happened since the last sync
                //but that's okay becuase oldPosition isn't used right now
                moveCard(card, data.position);
                sendAction('moveCard', data);
            }

        }
    });
}

//////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////

$(function () {


    //disable image dragging
    //window.ondragstart = function() { return false; };


    //if (boardInitialized === false)
    //blockUI('<img src="images/ajax-loader.gif" width=43 height=11/>');

    //setTimeout($.unblockUI, 2000);



    //此部分计划修改为创建指定颜色的卡片
    //var colours = ['yellow', 'green', 'blue', 'white'];
    $("#create-yellowcard")
        .click(function () {
            var rotation = Math.random() * 10 - 5; //add a bit of random rotation (+/- 10deg)
            uniqueID = Math.round(Math.random() * 99999999); //is this big enough to assure uniqueness?
            //alert(uniqueID);
            createCard(
                'card' + uniqueID,
                '',
                58, $('div.board-outline').height(), // hack - not a great way to get the new card coordinates, but most consistant ATM
                rotation,
                'yellow');
        });

    $("#create-greencard")
        .click(function () {
            var rotation = Math.random() * 10 - 5; //add a bit of random rotation (+/- 10deg)
            uniqueID = Math.round(Math.random() * 99999999); //is this big enough to assure uniqueness?
            //alert(uniqueID);
            createCard(
                'card' + uniqueID,
                '',
                58, $('div.board-outline').height(), // hack - not a great way to get the new card coordinates, but most consistant ATM
                rotation,
                'green');
        });


    $("#create-bluecard")
        .click(function () {
            var rotation = Math.random() * 10 - 5; //add a bit of random rotation (+/- 10deg)
            uniqueID = Math.round(Math.random() * 99999999); //is this big enough to assure uniqueness?
            //alert(uniqueID);
            createCard(
                'card' + uniqueID,
                '',
                58, $('div.board-outline').height(), // hack - not a great way to get the new card coordinates, but most consistant ATM
                rotation,
                'blue');
        });





    $("#create-whitecard")
        .click(function () {
            var rotation = Math.random() * 10 - 5; //add a bit of random rotation (+/- 10deg)
            uniqueID = Math.round(Math.random() * 99999999); //is this big enough to assure uniqueness?
            //alert(uniqueID);
            createCard(
                'card' + uniqueID,
                '',
                58, $('div.board-outline').height(), // hack - not a great way to get the new card coordinates, but most consistant ATM
                rotation,
                'white');
        });


    $("#saveImg").
        click(function () {
            // 调用html2canvas插件
            html2canvas(need).then(function (canvas) {
                // 调用Canvas2Image插件
                let w = $(window).width(); //图片宽度
                let h = $(window).height(); //图片高度
                // 保存
                let type = "png"; //图片类型
                let f = "default"; //图片文件名，自定义名称
                Canvas2Image.saveAsImage(canvas, w, h, type, f);
            });
        });



    $('#icon-col').hover(
        function () {
            $('.col-icon').fadeIn(10);
        },
        function () {
            $('.col-icon').fadeOut(150);
        }
    );

    $('#add-col').click(
        function () {
            createColumn('New');
            return false;
        }
    );

    $('#delete-col').click(
        function () {
            deleteColumn();
            return false;
        }
    );







    // $('#cog-button').click( function(){
    // 	$('#config-dropdown').fadeToggle();
    // } );

    // $('#config-dropdown').hover(
    // 	function(){ /*$('#config-dropdown').fadeIn()*/ },
    // 	function(){ $('#config-dropdown').fadeOut() }
    // );
    //

    $(".board-outline").resizable({
        ghost: false,
        minWidth: 700,
        minHeight: 400,
        maxWidth: 3200,
        maxHeight: 1800,
    });

    //A new scope for precalculating
    (function () {
        var offsets;

        $(".board-outline").bind("resizestart", function () {
            offsets = calcCardOffset();
        });
        $(".board-outline").bind("resize", function (event, ui) {
            adjustCard(offsets, false);
        });
        $(".board-outline").bind("resizestop", function (event, ui) {
            boardResizeHappened(event, ui);
            adjustCard(offsets, true);
        });
    })();



    $('#marker').draggable({
        axis: 'x',
        containment: 'parent'
    });

    $('#eraser').draggable({
        axis: 'x',
        containment: 'parent'
    });


});
