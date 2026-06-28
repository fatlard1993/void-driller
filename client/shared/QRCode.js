import qrCode from 'qrcode';
import { Component } from '@vanilla-bean/components';

export default class QRCode extends Component {
	constructor(options) {
		super({ ...options, tag: 'canvas' });
	}

	build() {

		qrCode.toCanvas(this.elem, this.options.src, this.options.qrCodeConfig || {}, (error) => {
			if (error) this.options?.onError?.(error);
		});
	}
}
