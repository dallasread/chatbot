var CustomElement = require('generate-js-custom-element'),
    bala          = require('balajs'),
    serialize     = require('../utils/serialize'),
    ajax          = require('../utils/ajax'),
    loadExternal = require('load-external'),
    GMAPS_INCLUDED;

function includeGmaps(apiKey, done) {
    if (GMAPS_INCLUDED) return done();
    if (!apiKey)        return done();

    GMAPS_INCLUDED = true;

    loadExternal('https://maps.googleapis.com/maps/api/js?key=' + apiKey + '&libraries=places', done);
}

var ChatBot = CustomElement.createElement({
    template: require('./index.html'),
    transforms: {
        next: function next(chatbot, message) {
            return function onNext(e) {
                e.preventDefault();

                var attr = chatbot.get('io.input.name'),
                    response = message.response || chatbot.get('io.response');

                if (attr) {
                    chatbot.updateUser(attr, message.text);
                }

                chatbot.setQuiet('io', undefined);
                chatbot.addMessage({ text: message.text, from: 'user' }, 0, 0);

                if (response) {
                    chatbot.addMessage(response);
                } else {
                    chatbot.complete();
                }
            };
        },

        submit: function submit(chatbot, message) {
            return function onSubmit(e) {
                e.preventDefault();

                var data = serialize(e.target),
                    attr = chatbot.get('io.input.name'),
                    response = message.response || chatbot.get('io.response');

                if (!data[attr] || !data[attr].length) {
                    return;
                }

                chatbot.updateUser(data);
                chatbot.get('tree').push({ text: data[attr], from: 'user' });
                chatbot.unset('io');

                if (response) {
                    chatbot.addMessage(response);
                } else {
                    chatbot.complete();
                }
            };
        },

        reset: function reset(chatbot, message) {
            return function onReset(e) {
                var tree = chatbot.get('tree'),
                    index = tree.indexOf(message);

                tree.splice(index, tree.length - index);

                chatbot.set('io', tree[index - 1]);
                chatbot.prepGeocodeFields();
                chatbot.focusIO();
            };
        },
    },
    partials: {
        message: require('../message/index.html'),
        io: require('../io/index.html')
    },
    components: {}
}, function ChatBot(options) {
    var _ = this;

    options = options || {};
    options.data = options || {};
    options.chatbot = _;
    options.user = {};
    options.tree = [];
    options.delay = 700;
    options.defaults = options.defaults || {};

    CustomElement.call(_, options);

    _.element.className = 'chatbot';
    _.addMessage(options.schema, 0);

    if (_.get('ioConfig.gmaps.apiKey')) {
        includeGmaps(_.get('ioConfig.gmaps.apiKey'));
    }
});

ChatBot.definePrototype({
    addMessage: function addMessage(message, typingDelay, messageDelay) {
        var _ = this;

        typingDelay  = typeof  typingDelay === 'undefined' ? _.get('delay') : typingDelay;
        messageDelay = typeof messageDelay === 'undefined' ? _.get('delay') : messageDelay;

        setTimeout(function() {
            _.set('agentIsTyping', _.get('defaults.agentIsTyping') || true);
            _.scrollToBottom();

            setTimeout(function() {
                _.get('tree').push(message);

                if (message.input) {
                    _.set('io', message);
                    _.prepGeocodeFields();
                    _.focusIO();
                }

                if (message.delayed) {
                    _.setQuiet('agentIsTyping', undefined);
                    _.addMessage(message.delayed);
                } else {
                    _.unset('agentIsTyping');
                    _.scrollToBottom();
                }

            }, messageDelay);
        }, typingDelay);
    },

    prepGeocodeFields: function prepGeocodeFields() {
        var _ = this;

        setTimeout(function() {
            var el = bala('io input[type=location]', _.element)[0];

            if (!el) return;
            if (el.gmaps) return;

            el.gmaps = new window.google.maps.places.Autocomplete(
                el,
                {
                    types: ['geocode']
                }
            );
        }, 0);
    },

    scrollToBottom: function scrollToBottom() {
        var _ = this;

        setTimeout(function() {
            window.scrollTo(0, _.element.scrollHeight);
        }, 0);
    },

    focusIO: function focusIO() {
        var _ = this;

        setTimeout(function() {
            var $input = bala('io input, io a', _.element);

            if ($input.length) {
                $input[0].focus();
            }
        }, 0);
    },

    updateUser: function updateUser(key, value) {
        var _ = this,
            user = _.get('user');

        if (typeof key === 'object') {
            for (var item in key) {
                user[item] = key[item];
            }
        } else {
            user[key] = value;
        }

        return user;
    },

    complete: function complete() {
        var _ = this,
            onComplete = _.get('onComplete');

        if (typeof onComplete === 'function') {
            onComplete.call(_);
        }
    },

    setQuiet: function setQuiet(key, value) {
        var _ = this;

        _._data[key] = value;
    },
});

ChatBot.ajax = ajax;

module.exports = ChatBot;
