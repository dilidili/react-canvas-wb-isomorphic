import React, {PropTypes} from 'react'
import styles from './ImageViewer.scss'
import _ from 'underscore'
import Image from '../common/Image'
import {velocityHelpers, VelocityComponent} from 'velocity-react'
import {Motion, spring} from 'react-motion'

// frame of image container
const IMAGE_CONTAINER_FRAME = [window.innerWidth, window.innerHeight - window.fontSize * 8]
const IMAGE_SWITCH_CURVE_X = window.fontSize * 3
const IMAGE_SWITCH_CURVE_Y = window.innerHeight / 3
const IMAGE_PADDING = window.fontSize

const ImageViwer = React.createClass({
	propTypes: {
		appearFrame: PropTypes.object.isRequired,
		srcList: PropTypes.object.isRequired,
		defaultIndex: PropTypes.number.isRequired,
		handClose: PropTypes.func.isRequired,
	},
	getInitialState() {
		return {
			isPresent: false,
			// user slide the screen to view all images. 
			touchTranslationX: 0,
			touchTranslationY: 0,
			currentPresentIndex: this.props.defaultIndex,

			hideToolkit: false,
		}
	},

	// Getter
	getLoadedAnimation(imageWidth, imageHeight, imageLeft, imageTop){
		const {appearFrame} = this.props
		let imageTransformation

		if (imageWidth / imageHeight > IMAGE_CONTAINER_FRAME[0] / IMAGE_CONTAINER_FRAME[1]) {
			const scale = IMAGE_CONTAINER_FRAME[0] / imageWidth
			imageTransformation = {
				width: IMAGE_CONTAINER_FRAME[0],
				height: scale * imageHeight,
				top: IMAGE_CONTAINER_FRAME[1] / 2 - scale * imageHeight / 2,
				left: 0,
			}
		} else {
			const scale = IMAGE_CONTAINER_FRAME[1] / imageHeight
			imageTransformation = {
				height: IMAGE_CONTAINER_FRAME[1],
				width: imageWidth * scale,
				top: 0,
				left: IMAGE_CONTAINER_FRAME[0] / 2 - scale * imageWidth / 2,
			}
		}

		return this.state.isPresent?{
			animation: velocityHelpers.registerEffect({
				calls: [
					// appear from invisibility 
					[{
						opacity: [1, 0],
					}, 0.3],
					// scale to suitable size and move to centre of screen
					[_.extend(imageTransformation), 0.35]
				],
			}),
			runOnMount: true,
		}: {
			animation: {
				width: imageWidth,
				height: imageHeight,
				left: imageLeft,
				top: imageTop,
				opacity: 0,
			},
			runOnMount: true,
			duration: 350,

			// Close the image viewer
			complete: () => {
				this.props.handClose()
			},
		}
	},
	getContainerLoadedAnimation(){
		return this.state.isPresent ? {
			animation: {
				top: window.innerHeight / 2 - IMAGE_CONTAINER_FRAME[1] / 2,
				left: 0,
				width: IMAGE_CONTAINER_FRAME[0],
				height: IMAGE_CONTAINER_FRAME[1],
			},
			duration: 350,
			delay: 300,
			runOnMount: true,
		} : {
			animation: {
				top: this.props.appearFrame.get('top') + window.headerHeight,
				left: this.props.appearFrame.get('left'),
				width: this.props.appearFrame.get('width'),
				height: this.props.appearFrame.get('height'),
			},
			duration: 350,
			runOnMount: true,
		}
	},
	getBackgroundColorAnimation() {
		return this.state.isPresent ? {
			animation: {
				opacity: 1,
			},
			duration: 250,
			delay: 100,
			runOnMount: true,
		} : {
			animation: {
				opacity: 0,
			},
			duration: 250,
			runOnMount: true,
		}
	},
	getUpperToolkitAnimation() {
		return this.state.hideToolkit ? {
			animation: {
				top: -2 * window.fontSize,
			},
			duration: 250,
		} : {
			animation: {
				top: 0.3 * window.fontSize,
			},
			duration: 250,
		}
	},
	getBottomToolkitAnimation(){
		return this.state.hideToolkit ? {
			animation: {
				bottom: -2 * window.fontSize,
			},
			duration: 250,
		} : {
			animation: {
				bottom: 0.8 * window.fontSize,
			},
			duration: 250,
		}	
	},

	// Handler
	handleClose(){
		this.setState({
			isPresent: false,
		})
	},
	handleImageLoaded(){
		this.setState({
			isPresent: true,
		})
	},
	handleTouchOverlayStart(evt) {
		evt.preventDefault()
		evt.stopPropagation()

		this._touchStart = this._touchRecorded = {
			clientX: evt.touches[0].clientX,
			clientY: evt.touches[0].clientY,
		}
		this._controlDirection = -1 // 0 for translating in X axis, 1 for translating in Y axis.
	},
	handleTouchOverlayMove(evt){
		evt.preventDefault()
		evt.stopPropagation()

		const deltaX = evt.touches[0].clientX - this._touchRecorded.clientX
		const deltaY = evt.touches[0].clientY - this._touchRecorded.clientY

		// first touch move event
		if (this._controlDirection === -1) {
			this._controlDirection = Math.abs(deltaX) > Math.abs(deltaY) ? 0 : 1
			this.setState({
				hideToolkit: this._controlDirection === 1 ? true : false,
			})
		}

		if (this._controlDirection === 0) {
			this.setState({
				touchTranslationX: this.state.touchTranslationX + deltaX,
			})
		} else if (this._controlDirection === 1) {
			this.setState({
				touchTranslationY: this.state.touchTranslationY + deltaY,
			})
		}

		this._touchRecorded = {
			clientX: evt.touches[0].clientX,
			clientY: evt.touches[0].clientY,
		}
	},
	handleTouchOverlayEnd(evt){
		evt.preventDefault()
		evt.stopPropagation()

		if (this._controlDirection === 0) {
			const delta = this._touchRecorded.clientX - this._touchStart.clientX

			if (Math.abs(delta) < IMAGE_SWITCH_CURVE_X) {
				this.setState({
					touchTranslationX: this.state.touchTranslationX - delta,
				})
			} else {
				// Slide Limit check
				const nextPresentIndex = this.state.currentPresentIndex - (delta > 0 ? (delta === 0 ? 0 : 1) : -1)

				if (nextPresentIndex >= 0 && nextPresentIndex < this.props.srcList.size) {
					this.setState({
						touchTranslationX: this.state.touchTranslationX - delta + (delta > 0 ? (delta === 0 ? 0 : 1) : -1) * (window.innerWidth),
						currentPresentIndex: nextPresentIndex,
					})
				} else {
					this.setState({
						touchTranslationX: this.state.touchTranslationX - delta,
					})
				}
			}
		}else if (this._controlDirection === 1) {
			const delta = this._touchRecorded.clientY - this._touchStart.clientY

			if (Math.abs(delta) < IMAGE_SWITCH_CURVE_Y) {
				this.setState({
					touchTranslationY: this.state.touchTranslationY - delta,
					hideToolkit: false,
				})
			} else {
				this.setState({
					touchTranslationY: this.state.touchTranslationY + delta,
					isPresent: false,
				})
			}
		}
	},

	// Renderer
	renderImageGallery(){
		const {
			defaultIndex,
			srcList,
			appearFrame,
		} = this.props

		return (
			<Motion style={{left: spring(this.state.touchTranslationX), top: spring(this.state.touchTranslationY)}}>
				{interpolatingStyle=>(
					<div 
						className={styles.imageGallery} 
						style={{width: window.innerWidth * srcList.size, height: 0, left: interpolatingStyle.left, top: interpolatingStyle.top}}
						onTouchStart={this.handleTouchOverlayStart}
						onTouchMove={this.handleTouchOverlayMove}
						onTouchEnd={this.handleTouchOverlayEnd}
					>
						{srcList.map((src, index)=>{
							// the entry image
							if (index === defaultIndex) {
								return <div key={index} style={{width: 0, height: 0, position: 'absolute', top: 0, left: 0}}>
									<Image 
										src={src.get('middle')} 
										width={appearFrame.get('width')} 
										height={appearFrame.get('height')} 
										useGray={false} 
										style={{borderRadius:5, top: appearFrame.get('top')+window.headerHeight, left: appearFrame.get('left')}}
										getLoadedAnimation={this.getLoadedAnimation}	
										getContainerLoadedAnimation={this.getContainerLoadedAnimation}
										handleLoad={this.handleImageLoaded}
										toggleRender={this.state.isPresent}
									/>
								</div>
							}else{
								return <div key={index} style={{width: 0, height: 0, position: 'absolute', top: 0, left: (index-defaultIndex)*window.innerWidth}}>
									<Image
										src={src.get('middle')} 
										width={appearFrame.get('width')} 
										height={appearFrame.get('height')} 
										useGray={false} 
										style={{borderRadius:5, top: appearFrame.get('top')+window.headerHeight, left: appearFrame.get('left')}}
										getLoadedAnimation={this.getLoadedAnimation}	
										getContainerLoadedAnimation={this.getContainerLoadedAnimation}
										handleLoad={()=>{this.setState({isPresent:true})}}
										toggleRender={this.state.isPresent}
									>
									</Image> 
								</div>
								return null
							}
						})}	
					</div>	
				)}
			</Motion>
		)
	},

	render: function() {
		const {
			appearFrame,
			srcList,
			defaultIndex,
		} = this.props

		return (
			// Full screen image viewer
			<div className={styles.container}
				style={{top:-window.headerHeight, left:0, width: window.innerWidth, height: window.innerHeight}}
				onTouchStart={this.handleTouchStart}
				onTouchMove={this.handleTouchMove}
				onTouchEnd={this.handleTouchEnd}
			>
				<VelocityComponent {...this.getBackgroundColorAnimation()}>
					<div 
						className={styles.blackOverlay}
					>
						<VelocityComponent {...this.getUpperToolkitAnimation()}>
							<span className={`Icon--close Icon ${styles.close}`} onClick={this.handleClose}></span>	
						</VelocityComponent>

						<VelocityComponent {...this.getBottomToolkitAnimation()}>
							<div className={styles.footerButton}>
								<span className={`Icon--reply Icon`}></span>	
								<span className={`Icon--retweet Icon`}></span>	
								<span className={`Icon--like Icon`}></span>	
								<span className={`Icon--other Icon`}></span>	
							</div>
						</VelocityComponent>
					</div>
				</VelocityComponent>

				{this.renderImageGallery()}
			</div>
		)
	},
})

export default ImageViwer 