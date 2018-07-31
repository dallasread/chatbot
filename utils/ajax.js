function ajax(settings) {
    var method = settings.method.toUpperCase(),
        xhr = new XMLHttpRequest(),
        data = settings.data;

    if (method === 'GET' && typeof data === 'object') {
        settings.url += '?';

        for (var key in settings.data) {
            console.log(key)
            settings.url += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(settings.data[key]);
        }
    } else {
        data = JSON.stringify(data);
    }

    xhr.addEventListener('readystatechange', function () {
        if (xhr.readyState === 4) {
            if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 304) {
                try {
                    settings.success.call(settings.context, JSON.parse(xhr.responseText));
                    return;
                } catch (e) {
                    settings.error.call(settings.context, e);
                }
            }

            settings.error.call(settings.context, xhr);
        }
    }, false);

    xhr.open(method, settings.url, typeof settings.async === 'undefined' ? true : settings.async);

    if (typeof settings.beforeSend === 'function') {
        settings.beforeSend.call(settings.context, xhr);
    }

    xhr.setRequestHeader('content-type', 'application/json');

    xhr.send(data);

    return this;
}

module.exports = ajax;
