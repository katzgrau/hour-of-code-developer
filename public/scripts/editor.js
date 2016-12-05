jQuery(function($) {
    $('#editor').height($(window).height() - $('nav').height());

    window.codeEditor = ace.edit("editor");
    window.codeEditor.setTheme("ace/theme/monokai");
    window.codeEditor.getSession().setMode("ace/mode/javascript");
    window.codeEditor.$blockScrolling = Infinity;

    $('#run-code').on('click', app.execute);
    $('#send-code').on('click', app.sendCode);
    $('#download-code').on('click', app.downloadCode);
    $('#clear-code').on('click', app.clearCode);
    $('#toggle-console').on('click', app.toggleConsole);

    // hotkeys (saving)
    var listener = new window.keypress.Listener(document);
    listener.simple_combo("meta s", app.save);
    listener.simple_combo("meta r", app.execute);

    // load snippets
    var nav = $('nav ul.dropdown-menu').first();
    $('script[type="text/snippet"]').each(function(i, el) {
        var snip = $(el);
        var li = $('<li>');
        var a = $('<a href="#"></a>').html(snip.attr('name'));

        a.on('click', function () {
            window.codeEditor.setValue(snip.html().trim());
            window.codeEditor.execCommand("gotolineend");
        });

        li.append(a);
        nav.append(li);
    });

    app.admin(JSON.parse(localStorage['hoc-admin'] || 'false'));
    app.toggleConsole(JSON.parse(localStorage['hoc-alt-console'] || 'false'));

    app.load();
});

// basic library to make things easy
window.app = new (function () {

    var _self = {}, _isAdmin = false, _altConsole = false, _userId = window.userId;

    _self.admin = function (isAdmin) {
        if (typeof isAdmin === 'undefined') {
            return _isAdmin;
        } else {
            localStorage['hoc-admin'] = isAdmin;
            _isAdmin = isAdmin;

            if (_isAdmin) {
                console.info('Admin mode ...');
                _self.loadSubmissions();
                jQuery('.user-only').hide();
                jQuery('.admin-only').show();
            } else {
                jQuery('.admin-only').hide();
                jQuery('.user-only').show();
            }
        }
    };

    _self.clearCode = function () {
        if (confirm('Are you sure you want to clear the code?')) {
            window.codeEditor.setValue('');
            window.codeEditor.execCommand("gotolineend");
        }
    };

    _self.clearSubmissions = function () {
        jQuery.get('/clear-submissions', {}, function (data) {
            console.log('Cleared submissions ...');
        });
    };

    _self.execute = function () {
        _self.save();
        console.info('Code Executing ...');
        try {
            eval(window.codeEditor.getValue());
        } catch (e) {
            console.warn('There was an error: ', e.toString());
        }
    };

    _self.sendCode = function (asAdmin) {
        if (typeof asAdmin !== 'boolean') {
            asAdmin = false;
        }
        var code = window.codeEditor.getValue();
        $.ajax({
            type: "POST",
            url: asAdmin ? 'admin-code' : '/submissions',
            data: JSON.stringify({code: code}),
            contentType : 'application/json',
            success: function () {
                if (!asAdmin) {
                    console.log('Submission for user #', _userId, 'sent...');
                }
            },
            dataType: 'json'
        });
    };

    _self.downloadCode = function () {
        jQuery.get('/admin-code', {}, function (data) {
            if (data.code) {
                window.codeEditor.setValue(data.code.trim());
            } else {
                console.info('No admin code available');
            }
        }, 'json');
    }

    _self.toggleConsole = function (forceOn) {
        _altConsole = !_altConsole;

        if (typeof forceOn == 'boolean' && forceOn) {
            _altConsole = forceOn;
        }

        localStorage['hoc-alt-console'] = _altConsole;

        if (_altConsole) {
            $('#editor').width('60%');
        } else {
            $('#editor').width('100%');
        }
    };

    _self.loadSubmissions = function () {
        if (!_isAdmin) return;
        setInterval (function() {
            jQuery.get('/submissions', {}, function (data) {
                var tab = $('.submissions a');
                var drop = $('.submissions ul').clone().empty();
                tab.text('Submissions (' + Object.keys(data.submissions).length + ')');
                jQuery.each(data.submissions, function (userId, submission) {
                    var li = $('<li>');
                    var a = $('<a href="#"></a>').html('User #' + userId + ' (' + submission.time + ')');
                    a.on('click', function () {
                        window.codeEditor.setValue("// Submission from user #" + userId + "\n//-------------------------\n\n" + submission.code.trim());
                        window.codeEditor.execCommand("gotolinestart");
                    });
                    li.append(a);
                    drop.append(li);
                    $('.submissions ul').replaceWith(drop);
                });
            }, 'json');
        }, 5000);
    };

    _self.save = function () {
        console.info('Code Saved ...');
        localStorage['hoc-code'] = window.codeEditor.getValue();
        if (_isAdmin) _self.sendCode(true);
    };

    _self.timer = function(name) {
        var start = new Date();
        return {
            stop: function() {
                var end  = new Date();
                var time = end.getTime() - start.getTime();
                console.log('Timer:', name, 'finished in', time, 'ms');
            }
        }
    };

    _self.load = function (tempalte) {
        window.codeEditor.setValue(localStorage['hoc-code'] || '');
    };

    return _self;

})();

window.web = new (function () {

    var _self = {};

    _self.get = function (url, cb) {
        console.info('Web request to', url, '...');
        jQuery.get('/proxy', {url: url}, function (data) {
            console.info('Received data');
            if (cb) cb (data);
        }, 'json');
    };

    _self.email = function (to, subject, message) {
        console.info('Sending email to', to);
        jQuery.get('/email', { to: to, subject: subject, message: message }, function (data) {
            console.info('Email sent ...');
        }, 'json');
    };

    return _self;

})();

window.User = new (function () {

    var _self = {},
        username = 'myusername',
        password = Math.floor((Math.random() * 10000000) + 1).toString();

    _self.login = function (user, pass) {

        if (user === username && password === pass.toString()) {
            return true;
        } else {
            return false;
        }
    };

    return _self;
})();