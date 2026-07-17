import qrCode from 'qrcode';
import { Component } from '@vanilla-bean/components';

export default class QRCode extends Component {
	static schema = {
		tag: { default: 'canvas' },
		src: {},
		qrCodeConfig: {},
	};

	build() {
		qrCode.toCanvas(this.elem, this.options.src, this.options.qrCodeConfig || {}, error => {
			if (error) this.options?.onError?.(error);
		});
	}
}
