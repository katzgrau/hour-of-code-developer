window.ogConsole = window.console;
window.console = {};
window.console.logLevel = function (level, args) {
    var out = '';
    if (level) out += level + ': ';
    args = Array.prototype.slice.call(args);
    for (var i = 0; i < args.length; i++) {
        if (typeof args[i] == 'string') {
            out += args[i] + ' ';
        } else {
            try {
                out += JSON.stringify(args[i], undefined, 2) + ' ';
            } catch (e) {
                out += args[i].toString() + ' ';
            }
        }
    }

    ogConsole[level || 'log'].apply(null, args);
    $('#console').append($('<div class="line">').text(out + "\n"));
    var c = document.getElementById("console");
    if (c) c.scrollTop = c.scrollHeight;
};

console.log = function () { console.logLevel(undefined, arguments); };
console.info = function () { console.logLevel('info', arguments); };
console.warn = function () { console.logLevel('warn', arguments); };