import { useState, useCallback, useMemo, MouseEventHandler, ChangeEvent, MouseEvent } from 'react';
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Input } from 'reactstrap';
import { faChevronDown, faTimes } from '@fortawesome/free-solid-svg-icons';
import { split, replace, toLower, all, flip, includes } from 'ramda';

import classnames from '../../../utils/classnames';
import InputIconAddon from '../input-icon-addon';
import './dropdown-search-select.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const DIVIDER = ' ';
const WHITESPACES_REGEXPR = /\s+/g;

// search query utils
const toSearchTags = (searchValue: string) =>
  split(DIVIDER, replace(WHITESPACES_REGEXPR, DIVIDER, toLower(searchValue)));
const doesStringContainsTags = (str: string, tags: any) => all(flip(includes)(str), tags);

const preventDefault: MouseEventHandler<HTMLElement> = (event) => event.preventDefault();

const getDisplayValue = (value: string, options: DropdownOption[], placeholder: string) => {
  if (!options.length || !value) {
    return placeholder;
  }

  const foundOption = options.find((option) => option.value === value);
  if (foundOption) {
    return foundOption.displayValue;
  }

  return value;
};

type DropdownOption = {
  value: string;
  displayValue: string;
  disabled?: boolean;
  skip?: boolean;
};

type DropdownSearchSelectProps = {
  value: string;
  onChange: (value: any) => void;
  onClear?: MouseEventHandler<HTMLSpanElement>;
  options: DropdownOption[];
  placeholder: string;
  disabled?: boolean;
  className?: string;
  valid?: boolean;
  invalid?: boolean;
  id?: string;
};

const DropdownSearchSelect = ({
  value,
  onChange,
  onClear,
  options,
  placeholder,
  disabled,
  className,
  valid,
  invalid,
}: DropdownSearchSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const toggle = useCallback(() => setIsOpen(!isOpen), [isOpen, setIsOpen]);

  const handleOptionClick = useCallback(
    (optionValue: string) => () => {
      onChange(optionValue);
    },
    [onChange],
  );

  const handleSearch = useCallback((event: ChangeEvent<HTMLInputElement>) => setSearchValue(event.target.value), [setSearchValue]);
  const handleClear = useCallback(
    (event: MouseEvent<HTMLSpanElement>) => {
      setSearchValue('');
      if (onClear) {
        onClear(event);
      }
    },
    [setSearchValue, onClear],
  );

  const optionsNodes = useMemo(() => {
    const searchTags = toSearchTags(searchValue);

    const filteredOptions = !searchTags.length
      ? options
      : options.filter(({ displayValue, skip }) =>
          skip ? true : doesStringContainsTags(toLower(displayValue), searchTags),
        );

    return filteredOptions.map((option) => (
      <DropdownItem
        key={option.value}
        active={value === option.value}
        onClick={handleOptionClick(option.value)}
      >
        {option.displayValue}
      </DropdownItem>
    ));
  }, [options, value, searchValue, handleOptionClick]);

  const displayValue = useMemo(
    () => getDisplayValue(value, options, placeholder),
    [value, options, placeholder],
  );

  const combinedClassName = useMemo(
    () =>
      classnames([
        'form-control text-start',
        {
          disabled,
          'is-valid': valid,
          'is-invalid': invalid,
        },
        className,
      ]),
    [className, disabled, valid, invalid],
  );

  return (
    <Dropdown isOpen={isOpen} toggle={toggle} className="dropdown-search-select">
      <DropdownToggle
        tag="button"
        className={combinedClassName}
        disabled={disabled}
        onClick={preventDefault}
      >
        <div className='d-flex justify-content-between align-items-center'>{displayValue} <FontAwesomeIcon icon={faChevronDown} style={{ height: '12px' }} /></div>
      </DropdownToggle>
      <DropdownMenu>
        <div className="px-2">
          <InputIconAddon
            align="right"
            icon={searchValue === '' ? null : faTimes}
            onClick={handleClear}
            className="clear-icon"
          >
            <Input
              type="text"
              placeholder="Найти"
              value={searchValue}
              onChange={handleSearch}
            />
          </InputIconAddon>
        </div>
        <DropdownItem divider />
        <div className="drowdown-menu-container">
          {!optionsNodes.length ? (
            <div className="text-center">Ничего не найдено</div>
          ) : (
            optionsNodes
          )}
        </div>
      </DropdownMenu>
    </Dropdown>
  );
};

DropdownSearchSelect.defaultProps = {
  placeholder: '',
  className: '',
  disabled: false,
  valid: false,
  invalid: false,
  onClear: (): any => undefined,
};

export default DropdownSearchSelect;
