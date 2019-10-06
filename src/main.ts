type SupportedQueryStringTypes = symbol | boolean | string | Object | Array<any> | number;

interface IQueryStringObject {
    [key: string]: SupportedQueryStringTypes;
}

class QueryString {
    static Encode(obj: IQueryStringObject, prefix: boolean = true, string: string = '') {
        // Dirty check to stop double ??
        if(string) prefix = false;

        for (const k in obj) {
            if(!obj.hasOwnProperty(k)) continue;
            if ((obj[k] === undefined || obj[k] === null || obj[k] === "" || obj[k] === [] || obj[k] === {}) ) continue;
            if(typeof obj[k] === "symbol" || typeof obj[k] === "bigint" || typeof obj[k] === "function") continue; // Currently not supported

            if(Array.isArray(obj[k])) string = QueryString.EncodeArray(string, k, obj[k]);
            else if (typeof obj[k] === "boolean" || typeof obj[k] === "string" || typeof obj[k] === "number") string =  QueryString.EncodeBooleanStringNumber(string, k, obj[k]);
            else if (typeof obj[k] === "object") string = QueryString.Encode( (obj[k] as any), prefix, string);
        }

        return QueryString.Output(string, prefix);
    }

    static EncodeArray(currentString: string, arrayKey: string, array: SupportedQueryStringTypes): string {
        if(currentString) currentString += '&';
        else currentString = '';

        // NOTE: Only 1 level deep (shallow)
        for (const value of (array as Array<any>)) {
            currentString += encodeURIComponent(arrayKey) + '=' + encodeURIComponent(value);
        }

        return currentString;
    }

    static EncodeBooleanStringNumber(currentString: string, arrayKey: string, value: SupportedQueryStringTypes) {
        if(currentString) currentString += '&';
        else currentString = '';

        currentString += encodeURIComponent(arrayKey) + '=' + encodeURIComponent( (value as string | boolean | number) );

        return currentString;
    }

    static Decode(string: string) {
        // if string has '?' remove it
        string = string.replace('?','');

        const queryString = string.split('&');

        interface LooseObject {
            [key: string]: any
        }

        const decodedQuery: LooseObject = {};
        queryString.forEach( query => {
            const numberOfFields = (query.match(/=/g)||[]).length;

            if(numberOfFields === 1) {
                const fieldAndData = query.split('=');
                if((fieldAndData[1] as unknown) == parseInt(fieldAndData[1])) (fieldAndData[1] as unknown) = parseInt(fieldAndData[1]);
                if(fieldAndData[1] == 'true') (fieldAndData[1] as unknown) = true;
                if(fieldAndData[1] == 'false') (fieldAndData[1] as unknown) = false;
                decodedQuery[fieldAndData[0]] = fieldAndData[1];
            }

            // NOTE: Cannot tell if it should be object or array, so its array for all
            if(numberOfFields > 1) {
                const fieldAndData = query.split('=');
                const test = fieldAndData.map(x => {
                    if(x.includes(fieldAndData[0])) x = x.replace(fieldAndData[0], '');
                    if(x === '' || x === null || x === undefined) return;
                    if((x as unknown) == parseInt(x)) (x as unknown) = parseInt(x);

                    return x;
                });
                test.splice(0, 1);
                decodedQuery[fieldAndData[0]] = test;
            }
        });

        return decodedQuery;
    }

    static Output(currentString: string, prefix: boolean) {
        if (prefix) return '?' + currentString;
        return currentString;
    }
}

console.log( QueryString.Encode({ foo: 'hello', bar: [1,2,3], baz: true, buzz: { one: 1 } }) );
// => ?foo=hello&bar=1bar=2bar=3&baz=true&one=1

console.log( QueryString.Decode('?foo=hello&bar=1bar=2bar=3&baz=true&one=1') );
// => { foo: 'hello', bar: [ 1, 2, 3 ], baz: true, one: 1 }

// TODO: Support BigInt, Symbol and Function
