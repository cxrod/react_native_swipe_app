import React, { Component } from 'react';
import { 
    View, 
    Animated,
    PanResponder,
    Dimensions,
    LayoutAnimation,
    UIManager
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SWIPE_OUT_DURATION = 300;

class Deck extends Component {

    static defaultProps = {
        onSwipeLeft: () => {},
        onSwipeRight: () => {}
    }

    constructor(props) {
        super(props);

        const position = new Animated.ValueXY();

        const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (event, gesture) => { 
                position.setValue({ x: gesture.dx, y: gesture.dy });
            },
            onPanResponderRelease: (event, gesture) => {
                if (gesture.dx > SWIPE_THRESHOLD) {
                    this.forceSwipe('right');
                } else if (gesture.dx < -SWIPE_THRESHOLD) {
                    this.forceSwipe('left');
                } else {
                    this.resetPosition();
                }
            }
        });

        this.panResponder = panResponder;
        this.position = position;
        this.state = { index: 0 };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.data !== this.props.data) this.setState({ index: 0 });
    }

    componentWillUpdate() {
        UIManager.setLayoutAnimationEnabledExperimental && 
            UIManager.setLayoutAnimationEnabledExperimental(true);
        LayoutAnimation.spring();
    }

    onSwipeComplete(direction) {
        const { onSwipeLeft, onSwipeRight, data } = this.props;
        const item = data[this.state.index];
        
        direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);
        this.position.setValue({ x: 0, y: 0 });
        this.setState({ index: this.state.index + 1 });
    }

    getCardStyle() {
        const rotate = this.position.x.interpolate({
            inputRange: [-SCREEN_WIDTH * 1.7, 0, SCREEN_WIDTH * 1.7],
            outputRange: ['-120deg', '0deg', '120deg']
        });

        return {
            ...this.position.getLayout(),
            transform: [{ rotate }]
        };
    }

    resetPosition() {
        Animated.spring(this.position, {
            toValue: { x: 0, y: 0 }
        }).start();
    }

    forceSwipe(direction) {
        const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
        Animated.timing(this.position, {
            toValue: { x: x * 2, y: 0 },
            duration: SWIPE_OUT_DURATION
        }).start(() => this.onSwipeComplete(direction));
    }

    renderCards() {
        if (this.state.index >= this.props.data.length) {
            return this.props.renderNoMoreCards();
        }
        return this.props.data.map((item, i) => {
            if (i < this.state.index) {
                return null;
            } else if (i === this.state.index) {
                return (
                    <Animated.View
                        key={item.id}
                        style={[this.getCardStyle(), styles.cardStyle, { zIndex: 99 }]}
                        {...this.panResponder.panHandlers}
                    >
                        {this.props.renderCard(item)}
                    </Animated.View>
                );
            }
            return (
                <Animated.View 
                    key={item.id} 
                    style={[
                            styles.cardStyle, 
                            { 
                                top: 4 * (i - this.state.index), 
                                zIndex: 5
                            }
                        ]}
                >
                    {this.props.renderCard(item)}
                </Animated.View>
            );
        }).reverse();
    }

    render() {
        return (
            <View>
                {this.renderCards()}
            </View>
        );
    }
}

const styles = {
    cardStyle: {
        position: 'absolute',
        width: SCREEN_WIDTH
    }
};

export default Deck;
