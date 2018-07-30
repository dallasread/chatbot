var bala = require('balajs');

function serializeForm(form) {
    var inputs = bala('[name]', form),
        json = {},
        input, i, n;

    for (i in inputs) {
        input = inputs[i];

        if (!input.name || (input.name[0] === '_' && input.name[1] === '_')) {
            continue;
        }

        n = {
            name: input.name,
            value: input.value || input.innerText
        };

        var _ = n.name.indexOf('[');

        if (_ > -1) {
            var len;
            var o = json;
            var _name = n.name.replace(/\]/gi, '').split('[');

            for (i=0, len=_name.length; i<len; i++) {
                if (i == len-1) {
                    if (o[_name[i]]) {
                        if (typeof o[_name[i]] == 'string') {
                            o[_name[i]] = [o[_name[i]]];
                        }

                        o[_name[i]].push(n.value);
                    } else {
                        o[_name[i]] = n.value || '';
                    }
                } else {
                    o = o[_name[i]] = o[_name[i]] || {};
                }
            }
        } else {
            if (json[n.name] !== undefined) {
                if (!json[n.name].push) {
                    json[n.name] = [json[n.name]];
                }

                json[n.name].push(n.value || '');
            } else {
                json[n.name] = n.value || '';
            }
        }
    }

    return json;
}

module.exports = serializeForm;
