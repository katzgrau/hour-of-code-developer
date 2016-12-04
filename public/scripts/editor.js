
jQuery(function($) {
    $('#editor').height($(window).height() - $('nav').height());

    window.codeEditor = ace.edit("editor");
    window.codeEditor.setTheme("ace/theme/monokai");
    window.codeEditor.getSession().setMode("ace/mode/javascript");
    window.codeEditor.$blockScrolling = Infinity;

    $('#run-code').on('click', app.execute);
    $('#send-code').on('click', app.sendCode);

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

    app.load();
});

// basic library to make things easy
window.app = new (function () {

    var _self = {}, _isAdmin = false, _userId = window.userId;

    _self.admin = function (isAdmin) {
        if (typeof isAdmin === 'undefined') {
            return _isAdmin;
        } else {
            localStorage['hoc-admin'] = isAdmin;
            _isAdmin = isAdmin;

            if (_isAdmin) {
                console.info('Admin mode ...');
                _self.loadSubmissions();
            } else {

            }
        }
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

    _self.sendCode = function () {
        var code = window.codeEditor.getValue();
        $.ajax({
            type: "POST",
            url: '/submissions',
            data: JSON.stringify({code: code}),
            contentType : 'application/json',
            success: function () {
                console.log('Submission for user #', _userId, 'sent...')
            },
            dataType: 'json'
        });
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
                    var a = $('<a href="#"></a>').html('User #' + userId + '(' + submission.time + ')');
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
    };

    _self.load = function (tempalte) {
        window.codeEditor.setValue(localStorage['hoc-code'] || '');
    };

    if (localStorage['hoc-admin']) {
        _self.admin(true);
    }

    return _self;

})();

window.web = new (function () {

    var _self = {};

    _self.get = function (url, cb) {
        console.info('Web request to', url, '...');
        jQuery.get('/proxy', {url: url}, function (data) {
            console.info('Received data', data);
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
        password = 'NjU0MzIx';

    _self.login = function (user, pass) {

        if (user === username && atob(password) === pass.toString()) {
            return true;
        } else {
            return false;
        }
    };

    return _self;
})();