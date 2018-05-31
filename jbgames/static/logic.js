/*
    This file is the js logic for the web client for the software on my graduation cap, Jeffrey-Gradcap.
    Copyright (C) 2018 John Westhoff

    This file is part of Jeffrey-Gradcap.

    Jeffrey-Gradcap is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Jeffrey-Gradcap is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Jeffrey-Gradcap.  If not, see <http://www.gnu.org/licenses/>.
*/
const cell_prefix = 'cell_';
const modes = ["off", "showing the above", "showing the ND logo", "showing the game of life"]

var v = 0;
var zoom = 1024;


function read() {
    $.get( "read", {'v': v}, function(data) {
        console.log(data);
        var p = JSON.parse(data);
        if (p['status'] === 'success') {
            if (v < p['payload']['v']) {
                var colors = p['payload']['colors']
                for (var key in colors) {
                    $("#" + cell_prefix + key).css('background-color', colors[key]);
                }
            }
            v = p['payload']['v'];
            $('#mode').text('The hat is currently '+modes[p['payload']['mode']]+'.');
            $('#users').text('You are one of '+p['payload']['users']+' users.');
        }
        setTimeout(read, 1000);
    }).fail(function() {
        setTimeout(read, 50);
    });
}

function chzoom(w) {
    zoom *= w;
    $('#zoomable').css('width', zoom+"px");
    $('#zoomable').css('height', zoom+"px");
}

$(function() {
    var palette = $('ul');
    for (var i = 0; i < 32*32; i++) {
        var n = $('<li />').css('background-color', '#000000');
        n.attr('id', cell_prefix + i);
        palette.append(n);
    }

    $('li').on('click', function(e) {
        var color = '#' + $('#brush').val();
        var id = $(this).attr('id').split('_')[1];

        $.get("write", {'id': id, 'color': color});
        $(this).css('background-color', color);
    });

    zoom = $('#zoomable').outerWidth(true);

    $('#zoomout').on('click', function(e) {
        chzoom(1/1.2);
    });

    $('#zoomin').on('click', function(e) {
        chzoom(1.2);
    });

    read();
});
