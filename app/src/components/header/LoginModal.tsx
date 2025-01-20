import { Form } from "react-router";
import { Button } from "~/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog";
import googleIcon from "~/src/assets/images/googleIcon.svg";

interface Props {
    showDialog: boolean;
    onClose: (success?: boolean) => void;
}

const LoginModal = (props: Props) => {
    return (
        <Dialog open={props.showDialog} onOpenChange={() => props.onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-3xl text-center">Login</DialogTitle>
                </DialogHeader>

                <div className="w-full">
                    <Form
                        method="post"
                        action="/login"
                        className="flex-col items-center justify-center w-full space-y-2"
                    >
                        <div className="flex items-center justify-center w-full">
                            <Button
                                variant="outline"
                                className="w-60 mt-10 flex items-center gap-2"
                                type="submit"
                            >
                                <img src={googleIcon} className="h-5 w-5" alt="Google icon" />
                                <span>Sign in with Google</span>
                            </Button>
                        </div>
                    </Form>
                </div>

                <DialogFooter>
                    <Button onClick={() => props.onClose(true)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default LoginModal;
