import { Elem, styled } from '@vanilla-bean/components';

export class ConfigStat extends (styled.Component`
	display: flex;
	justify-content: space-between;
	align-items: center;
	width: 100%;
`) {
	static schema = {
		label: {},
		value: {},
	};

	build() {
		if (this.options.value === 0 || this.options.value === undefined) return;

		const isNumber = typeof this.options.value === 'number';

		new Elem({ appendTo: this, content: this.options.label });

		new Elem({
			appendTo: this,
			content: `${isNumber && this.options.value > 0 ? '+' : ''}${this.options.value}`,
		});
	}
}
