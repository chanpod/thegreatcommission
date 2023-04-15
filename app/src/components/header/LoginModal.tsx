import { Form } from "@remix-run/react";
import { Button, Modal } from "flowbite-react";
import { ClientOnly } from "remix-utils";
import googleIcon from "~/src/assets/images/googleIcon.svg";

interface Props {
    showDialog: boolean;
    onClose: (success?: boolean) => void;
}

const LoginModal = (props: Props) => {
    return (
        <ClientOnly>
            {() => (
                <Modal show={props.showDialog} onClose={() => props.onClose()}>
                    <div className="items-center w-full p-3">
                        <div className="text-3xl text-center">Login</div>
                    </div>
                    <hr />
                    <Modal.Body>
                        <div className="w-full">
                            <Form
                                method="post"
                                action="/login"
                                className="flex-col items-center justify-center w-48 space-y-2 w-full"
                            >
                                <div className="flex items-center justify-center w-full">
                                    <button
                                        className="google-btn transition duration-150 w-60 mt-10 ease-in-out hover:bg-primary-700 hover:shadow-lg focus:bg-primary-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-primary-800 active:shadow-lg"
                                        data-te-ripple-init
                                        data-te-ripple-color="light"
                                    >
                                        <span className="google-icon">
                                            <img src={googleIcon} />
                                        </span>
                                        <span className="google-text">Sign in with Google</span>
                                    </button>
                                </div>
                            </Form>
                        </div>
                    </Modal.Body>

                    <Modal.Footer>
                        <Button onClick={() => props.onClose(true)}>Close</Button>
                    </Modal.Footer>
                </Modal>
            )}
        </ClientOnly>
    );
};

export default LoginModal;
