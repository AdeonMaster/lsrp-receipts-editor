import { MouseEventHandler, ReactNode, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

import classnames from '../../../utils/classnames';

import './input-icon-addon.scss';

export type InputIconAddonProps = {
  icon: IconProp | null;
  align: string;
  onClick?: MouseEventHandler<HTMLSpanElement>;
  className?: string;
  iconClassName?: string;
  children: ReactNode;
};

const InputIconAddon = ({
  icon,
  align,
  onClick,
  className,
  iconClassName,
  children,
}: InputIconAddonProps) => {
  const rootCombinedClassName = useMemo(
    () => classnames(['inner-addon', { [`${align}-addon`]: !!icon }, className]),
    [align, icon, className],
  );
  const iconCombinedClassName = useMemo(
    () => classnames(['glyphicon', { 'glyphicon-button': !!onClick }, iconClassName]),
    [iconClassName, onClick],
  );

  return (
    <div className={rootCombinedClassName}>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
      <span className={iconCombinedClassName} onClick={onClick}>
        {icon && <FontAwesomeIcon icon={icon} />}
      </span>
      {children}
    </div>
  );
};

InputIconAddon.defaultProps = {
  align: 'left',
};

export default InputIconAddon;
