interface Message<T = any> {
    site: string;
    winuuid: string
    user?: string;
    tokan?: string;
    type?: string;
    data?: T;
}