(function (){
let wdstf = 'harry truman doris day red china johnnie ray south pacific walter winchell joe dimaggio joe mccarthy richard nixon studebaker television north korea south korea marilyn monroe rosenbergs h-bomb sugar ray panmunjom brando the king and i and the catcher in the rye eisenhower vaccine englands got a new queen marciano liberace santayana goodbye we didnt start the fire joseph stalin malenkov nasser and prokofiev rockefeller campanella communist bloc roy cohn juan peron toscanini dacron dien bien phu falls rock around the clock einstein james dean brooklyns got a winning team davy crockett peter pan elvis presley disneyland bardot budapest alabama krushchev princess grace peyton place trouble in the suez little rock pasternak mickey mantle kerouac sputnik chou en-lai bridge on the river kwai lebanon charles de gaulle california baseball starkweather homicide children of thalidomide buddy holly ben hur space monkey mafia hula hoops castro edsel is a no-go u2 syngman rhee payola and kennedy chubby checker psycho belgians in the congo hemingway eichmann stranger in a strange land dylan berlin bay of pigs invasion lawrence of arabia british beatlemania ole miss john glenn liston beats patterson pope paul malcolm x british politician sex jfk blown away birth control ho chi minh richard nixon back again moonshot woodstock watergate punk rock begin reagan palestine terror on the airline ayatollahs in iran russians in afghanistan wheel of fortune sally ride heavy metal suicide foreign debts homeless vets aids crack bernie goetz hypodermics on the shore chinas under martial law rock and roller cola wars';
var cash = 0;
var max_clue = 1000;
var clues = 0;
var the_goods = [];
document.querySelectorAll('.clue').forEach(function(clue) {
    let answer_regex = /correct_response&quot;>([^<]*)/g;
    let clue_value = clue.querySelector('.clue_value');
    clues += 1;
    if (clue_value) {
        cv = parseInt(clue_value.innerHTML.substring(1));
    } else {
        if (clues > 60) {
            cv = 4000;
        } else if (clues > 30) {
            cv = 2000;
        } else {
            cv = 1000;
        }
    }
    let match = answer_regex.exec(clue.outerHTML);
    if (match) {
        let answer = match[1].replace("'", "").replace(",", "").replace('"', "").toLowerCase();
        if (wdstf.includes(answer) && answer) {
            the_goods.push("What is " + match[1] + "? for $" + cv);
            cash += cv;
        }
    }
});
alert("Just knowing We Didn't Start The Fire would have gotten you $" + cash + 
    ".\nYou would have gotten the following clues: \n" + the_goods.join("\n"));
})();
