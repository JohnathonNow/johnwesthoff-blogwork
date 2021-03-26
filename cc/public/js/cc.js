var names = ['Atari Joystick', 'NES', 'SNES', 'Sega Master System', 'Sega Genesis ', 'Playstation 1', 'Nintendo 64', 'Dreamcast', 'Playstation 2', 'Xbox Duke', 'GameCube', 'Wii Remote + Nunchuck', 'Xbox 360 ', 'Wii Classic Controller', 'Playstation 3', 'Wii U Gamepad', 'Playstation 4', 'Xbox One ', 'Switch Pro Controller', 'Joycons', 'Playstation 5', 'Xbox Series X | S', 'Steam Controller', 'Logitech F series gamepads', 'Wii U Pro controller', 'Beta Steam Controller', 'Stadia Controller', 'Luna Controller', 'Keyboard and Mouse'];
var picts = [
    'https://upload.wikimedia.org/wikipedia/commons/3/33/Atari-2600-Joystick.jpg',
    'https://images-na.ssl-images-amazon.com/images/I/71hHhe1lZML._SL1500_.jpg',
    'https://images-na.ssl-images-amazon.com/images/I/810kGqyc-lL._SL1500_.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/b/b6/Sega-Master-System-Controllers.jpg',
    'https://i5.walmartimages.com/asr/25098474-4a28-40c0-8e64-0aec5533a627_1.5a58eaa464eb3096e3c4bec309ff24c5.jpeg',
    'https://images-na.ssl-images-amazon.com/images/I/71d%2BmlMDLgL._SL1500_.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/5/56/N64-Controller-Gray.jpg',
    'https://cdn.shopify.com/s/files/1/1104/2322/products/AEY18_-_Sega_Dreamcast_Controller_-_Gray_-_HKT-7700_-_revised_802x853_fe5dbef8-0419-452a-b91c-f7fb422c8367.png?v=1605927340',
    'https://media.gamestop.com/i/gamestop/10168137/Sony-DUALSHOCK-2-Wired-Controller',
    'https://upload.wikimedia.org/wikipedia/commons/c/c5/Xbox-Duke-Controller.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/a/a5/GameCube_controller.png',
    'https://i5.walmartimages.com/asr/9a2b7c26-7a37-463d-b94e-10294fcf1b43_1.23ddf16eb0212ed65a6b9ea4aaeae066.jpeg?odnWidth=612&odnHeight=612&odnBg=ffffff',
    'https://images-na.ssl-images-amazon.com/images/I/61ctfFQjHlL._AC_SL1000_.jpg',
    'https://images-na.ssl-images-amazon.com/images/I/71TyGz-%2BqQL._SL1500_.jpg',
    'https://images-na.ssl-images-amazon.com/images/I/61nyaUEzFlL._SL1024_.jpg',
    'https://tse2.mm.bing.net/th?id=OIP.ncQQ0RIsGVR1gNaleXG3aAHaEA&pid=ImgDet&rs=1',
    'https://media.extra.com/s/aurora/00194580_800/PS4-Dualshock-4-wireless-controller-V2?locale=en-GB,en-*,*',
    'https://tse2.mm.bing.net/th?id=OIP.tfXZAuisUwbHhKQ72J3aqQHaGP&pid=ImgDet&rs=1',
    'https://images-na.ssl-images-amazon.com/images/I/61mCWiQxxHL._AC_SY355_.jpg',
    'https://tse2.mm.bing.net/th?id=OIP.HidGJc8RRf_h1xJvpHY5WwHaIP&pid=ImgDet&rs=1',
    'https://cdn.fbtb.net/wp-content/uploads/2020/04/08082707/ps5-controller.jpg',
    'https://tse2.mm.bing.net/th?id=OIP.DabEEqLj3IIRcrHWyVN13gHaHa&pid=ImgDet&rs=1',
    'https://cdn2.expertreviews.co.uk/sites/expertreviews/files/2015/12/steam_controller_9.jpg?itok=0EfdYje5',
    'https://th.bing.com/th/id/R14e484080330e5566283e68d7161bb3c?rik=t3q8i7xxY3WsKQ&riu=http%3a%2f%2fstatic.stuff.co.nz%2ffiles%2fLogitechController&ehk=Y9LD37nFwj0PbO76jhsZcJuiKTTcLSF9DxNbeozlgYg%3d&risl=&pid=ImgRaw',
    'https://th.bing.com/th/id/R3fe395ac6508c152a3295eeaed399a4c?rik=ux%2byBm1bu1Z5PA&riu=http%3a%2f%2fgamechanger.co.ke%2fwp-content%2fuploads%2f2016%2f08%2fNintendo-Wii-U-Pro-Controller-Black3.jpg&ehk=5uXOZxW6Iw02LY4%2fdv0gsvNTLz7E37QgUYdkVt%2fFcsM%3d&risl=&pid=ImgRaw',
    'https://i.ebayimg.com/images/g/zLgAAOSw~pRfsrJA/s-l300.jpg',
    'https://i5.walmartimages.com/asr/410333b0-0685-4034-8249-fe472076f533.0d43cd3fbda5d3746480a51b911334ea.jpeg?odnWidth=undefined&odnHeight=undefined&odnBg=ffffff',
    'https://media.techpp.com/wp-content/uploads/2020/09/Luna-Controller.jpg',
    'https://i5.walmartimages.com/asr/c2b11e55-0323-4efa-a315-aaa8e6e8fb23_1.b74e7961fc2cde8140300cbd79fb198d.jpeg'
]
var I = 0;
var J = 0;

function set_info(which, to) {
    $('#' + which).html(which+': ' + names[to]);
    $('#' + which + 'pic').attr('src', picts[to]);
}

function send(r) {
    $.ajax({
        url: "/submit/"+get_name()+"/"+I+"/"+J+"/"+r,
        type: "GET",
        success: function (response) {
            if (response['status'] === 'success') {
                var pl = response['payload'];
                I = pl['i'];
                J = pl['j'];
                set_info('A', I);
                set_info('B', J);
            }
        },
        error: function (e) {
            console.log(e);
        }
    });
}

function get_name() {
    var n = $('#name').val();
    if (n.length < 2) {
        alert('Please use longer name!');
        return '__throw_out__';
    }
    return n;
}

function onload_cc() {
    $("#abetter").click(function () {
        send(1);
    });
    $("#bbetter").click(function () {
        send(2);
    });
    $("#tie").click(function () {
        send(3);
    });
    $("#skip").click(function () {
        send(-1);
    });
    send(-1);
}