import './Footer.css'
import { Link } from 'react-router-dom';


function Footer() {
    return (
        <>
            {/* Footer Start */}
            <div className="container-fluid bg-dark2 text-light mt-5">
                <div className="container">
                    <div className="row gx-5">
                        <div className="col-lg-4 col-md-6 footer-about">
                            <div className="d-flex flex-column align-items-center justify-content-center text-center h-100 bg-primary p-4">
                                <a href="index.html" className="navbar-brand">
                                    <h1 className="m-0 text-white"><i className="fa fa-user-tie me-2"></i>Vital Care</h1>
                                </a>
                                <p className="mt-3 mb-4">Discover the healing world of smart health monitoring</p>
                            </div>
                        </div>
                        <div className="col-lg-8 col-md-6">
                            <div className="row gx-5">
                                <div className="col-lg-4 col-md-12 pt-5 mb-5">
                                    <div className="section-title section-title-sm position-relative pb-3 mb-4">
                                        <h3 className="text-light mb-0">Get In Touch</h3>
                                    </div>
                                    <div className="d-flex mb-2">
                                        <i className="bi bi-geo-alt text-primary me-2"></i>
                                        <p className="mb-0">University of Limerick</p>
                                    </div>
                                    <div className="d-flex mb-2">
                                        <i className="bi bi-envelope-open text-primary me-2"></i>
                                        <p className="mb-0">norouzipardis73@gmail.com</p>
                                    </div>
                                    <div className="d-flex mb-2">
                                        <i className="bi bi-telephone text-primary me-2"></i>
                                        <p className="mb-0">+353 8333 66124</p>
                                    </div>
                                    {/* <div className="d-flex mt-4">
                                        <a className="btn btn-primary btn-square me-2" href="#"><i className="fab fa-twitter fw-normal"></i></a>
                                        <a className="btn btn-primary btn-square me-2" href="#"><i className="fab fa-facebook-f fw-normal"></i></a>
                                        <a className="btn btn-primary btn-square me-2" href="#"><i className="fab fa-linkedin-in fw-normal"></i></a>
                                        <a className="btn btn-primary btn-square" href="#"><i className="fab fa-instagram fw-normal"></i></a>
                                    </div> */}
                                </div>

                                <div className="col-lg-4 col-md-12 pt-0 pt-lg-5 mb-5">
                                    <div className="section-title section-title-sm position-relative pb-3 mb-4">
                                        <h3 className="text-light mb-0">Quick Links</h3>
                                    </div>
                                    <div className="link-animated d-flex flex-column justify-content-start">
                                    <Link to="/" className="text-light mb-2"><i className="bi bi-arrow-right text-primary me-2"></i>Home</Link>
                                    <Link to="/about" className="text-light mb-2"><i className="bi bi-arrow-right text-primary me-2"></i>About Us</Link>
                                    <Link to="/Feedback" className="text-light mb-2"><i className="bi bi-arrow-right text-primary me-2"></i>Feedback</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="container-fluid text-white" style={{ background: '#061429' }}>
                <div className="container text-center">
                    <div className="row justify-content-end">
                        <div className="col-lg-8 col-md-6">
                            <div className="d-flex align-items-center justify-content-center" style={{ height: '75px' }}>
                                <p className="mb-0">&copy; <a className="text-white border-bottom" href="#">Vital Care</a>. All Rights Reserved.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Footer End */}
            <a href="#" className="btn btn-lg btn-primary btn-lg-square rounded back-to-top">
            <i className="bi bi-arrow-up"></i>
        </a>
        </>
    );
}

export default Footer;