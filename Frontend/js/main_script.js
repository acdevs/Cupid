const open = document.querySelector('.nav');
		const close = document.querySelector('.close');
		var tl = gsap.timeline({ defaults: { duration: 1, ease: 'expo.inOut' } });
		open.addEventListener('click', () => {
			if (tl.reversed()) {
				tl.play();
			} else {
				tl.to('nav', { right: 0 })
					.to('nav', { height: '100vh' }, '-=.1')
					.to('nav ul li a', { opacity: 1, pointerEvents: 'all', stagger: .2 }, '-=.8')
					.to('.close', { opacity: 1, pointerEvents: 'all' }, "-=.8")
					.to('nav h2', { opacity: 1 }, '-=1')
                    .to('.container a  ', { opacity: 0 }, '-=3')                   
					.to('.container h1', { opacity: 0 }, '-=3')
					.to('.bars', { opacity: 0 }, '-=3')
					.to('.container h2', { opacity: 0 }, '-=3');
			}
		});

		close.addEventListener('click', () => {
			tl.reverse();
		});