var Generator = require('generate-js');

var MailChimp = Generator.generate(function MailChimp(apiKey, listId) {
    var _ = this;

    _.defineProperties({
        apiKey: apiKey,
        listId: listId
    });
});

MailChimp.definePrototype({
    buildMerge: function buildMerge(user, prefix) {
        var _ = this,
            str = '';

        prefix = prefix || '';

        for (var key in user) {
            if (typeof user[key] === 'object') {
                str += _.buildMerge(user[key], prefix + key + '][');
            } else {
                str += '&merge_vars[' + prefix + key + ']=' + encodeURIComponent(user[key]);
            }
        }

        return str;
    },

    buildUrl: function buildUrl() {
        var _ = this;
        return 'https://' + _.apiKey.split('-')[1] + '.api.mailchimp.com/2.0/lists/subscribe.json';
    },

    save: function save(user) {
        var _ = this,
            url = _.buildUrl() + '?';

        if (!user.EMAIL && !user.PHONE) return;

        if (!user.EMAIL || !user.EMAIL.length) {
            user.EMAIL = encodeURIComponent('phone+' + user.PHONE.replace(/\D/g, '') + '@growthengine.com');
        }

        url += '&apikey=' + _.apiKey;
        url += '&id=' + _.listId;
        url += '&email[email]=' + user.EMAIL;
        url += _.buildMerge(user);
        url += '&double_optin=' + false;
        url += '&send_welcome=' + false;

        window.Chatbot.ajax({
            url: url,
            async: false,
            method: 'POST',
            success: console.log,
            error: console.error
        });
    }
});

module.exports = MailChimp;
