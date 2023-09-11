import { type ComponentChildren, toChildArray } from 'preact';
import type { HTMLAttributes } from 'preact/compat';
import { type CSSProperties } from 'preact/compat';

import { type Theme } from '../../Theme';
import { createClassName } from '../../helpers/createClassName';
import styles from './styles.scss';

type HeaderProps = {
	children: ComponentChildren;
	theme?: Partial<Theme>;
	className: string;
	post: ComponentChildren;
	large: boolean;
	style?: CSSProperties;
} & Omit<HTMLAttributes<HTMLElement>, 'children' | 'style'>;

export const Header = ({
	children,
	theme: { color: backgroundColor, fontColor: color } = {},
	className,
	post,
	large,
	style,
	...props
}: HeaderProps) => (
	<header
		className={createClassName(styles, 'header', { large }, [className])}
		style={style || backgroundColor || color ? { ...(style || {}), backgroundColor, color } : undefined}
		{...props}
	>
		{children}
		{post}
	</header>
);

type PictureProps = {
	children: ComponentChildren;
	className?: string;
};

export const Picture = ({ children, className = undefined, ...props }: PictureProps) => (
	<div className={createClassName(styles, 'header__picture', {}, [className])} {...props}>
		{children}
	</div>
);

type ContentProps = {
	children: ComponentChildren;
	className?: string;
};

export const Content = ({ children, className = undefined, ...props }: ContentProps) => (
	<div className={createClassName(styles, 'header__content', {}, [className])} {...props}>
		{children}
	</div>
);

type TitleProps = {
	children: ComponentChildren;
	className?: string;
};

export const Title = ({ children, className = undefined, ...props }: TitleProps) => (
	<div className={createClassName(styles, 'header__title', {}, [className])} {...props}>
		{children}
	</div>
);

type SubTitleProps = {
	children: ComponentChildren;
	className?: string;
};

export const SubTitle = ({ children, className = undefined, ...props }: SubTitleProps) => (
	<div
		className={createClassName(
			styles,
			'header__subtitle',
			{
				children: toChildArray(children).length > 0,
			},
			[className],
		)}
		{...props}
	>
		{children}
	</div>
);

type ActionsProps = {
	children: ComponentChildren;
	className?: string;
};

export const Actions = ({ children, className = undefined, ...props }: ActionsProps) => (
	<nav className={createClassName(styles, 'header__actions', {}, [className])} {...props}>
		{children}
	</nav>
);

type ActionProps = {
	children: ComponentChildren;
	className?: string;
} & Omit<HTMLAttributes<HTMLButtonElement>, 'className'>;

export const Action = ({ children, className = undefined, ...props }: ActionProps) => (
	<button className={createClassName(styles, 'header__action', {}, [className])} {...props}>
		{children}
	</button>
);

type PostProps = {
	children: ComponentChildren;
	className?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, 'className'>;

export const Post = ({ children, className = undefined, ...props }: PostProps) => (
	<div className={createClassName(styles, 'header__post', {}, [className])} {...props}>
		{children}
	</div>
);

type CustomFieldProps = {
	children: ComponentChildren;
	className?: string;
};

export const CustomField = ({ children, className = undefined, ...props }: CustomFieldProps) => (
	<div className={createClassName(styles, 'header__custom-field', {}, [className])} {...props}>
		{children}
	</div>
);

Header.Picture = Picture;
Header.Content = Content;
Header.Title = Title;
Header.SubTitle = SubTitle;
Header.Actions = Actions;
Header.Action = Action;
Header.Post = Post;
Header.CustomField = CustomField;

export default Header;
