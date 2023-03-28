/* eslint no-plusplus:0 sonarjs/cognitive-complexity:0 */
const SPACE_DELIMITER = ' ';

/**
 * Generate className string (faster than classnames package)
 *
 * @example
 * const className = classnames(['foo', 'bar', { baz: true }]); // 'foo bar baz'
 */
const classnames = (names: any): string => {
  let tmp: any = typeof names;
  let out = '';

  if (tmp === 'string' || tmp === 'number' || tmp === 'undefined') {
    return names || '';
  }

  if (Array.isArray(names) && names.length > 0) {
    for (let i = 0, len = names.length; i < len; ++i) {
      tmp = classnames(names[i]);

      if (tmp !== '') {
        out += (out && SPACE_DELIMITER) + tmp;
      }
    }
  } else {
    const keys = Object.keys(names);

    for (let i = 0, len = keys.length; i < len; ++i) {
      if (Object.prototype.hasOwnProperty.call(names, keys[i]) && names[keys[i]]) {
        out += (out && SPACE_DELIMITER) + keys[i];
      }
    }
  }

  return out;
};

export default classnames;
